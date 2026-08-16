import { useEffect, useRef } from "react";
import { SPEECH_ERROR_KEYS, FATAL_SPEECH_ERRORS } from "../constants/speechErrors.js";
import {
  tokensEqual,
  tokensSoftMatch,
  normalizeWord,
  findResyncMatch,
} from "../utils/matching.js";

// Re-sync window (in words) used when the speaker skips a whole phrase and
// the local per-line search misses. Covers skipping a few phrases/paragraph;
// beyond that, a stricter far re-sync over the rest of the script kicks in.
const RESYNC_NEAR_DISTANCE = 200;

// Web Speech API recognition + the paragraph-bounded voice-matching engine.
// This logic was stabilized over several debugging passes (v2.4.3-v2.4.7)
// to prevent voice tracking from skipping paragraphs or getting stuck —
// treat any change here as a behavior change, not a cleanup opportunity.
export default function useSpeechRecognition({
  language,
  t,
  lookaheadWindow,
  paragraphLookahead,
  skipCoHostLines,
  wordsRef,
  normalizedWordsRef,
  linesWordsRef,
  lineStartIndexRef,
  lineIsCoHostRef,
  skippableWordsRef,
  currentWordIndexRef,
  setCurrentWordIndex,
  isListening,
  setIsListening,
  setIsPlaying,
  setIsSpeaking,
  setMicStatus,
  setUserIsInteracting,
  userInteractTimeoutRef,
  prevLineIdxRef,
  prevVisualLineIdxRef,
  scrollAnimTokenRef,
  centerOnWordSmoothRef,
}) {
  const recognitionRef = useRef(null);
  // Co-host markers: live ref for the setting (refs so the speech-recognition
  // closures always see fresh values)
  const skipCoHostRef = useRef(true);
  const isListeningRef = useRef(false);
  const recognizingRef = useRef(false);
  const lastMicResultTsRef = useRef(performance.now());
  const micForceStoppedRef = useRef(false);
  const micRestartTimeoutRef = useRef(null);
  const micStatusRef = useRef("");
  const speakingTimeoutRef = useRef(null);

  const updateMicStatus = (message) => {
    if (micStatusRef.current === message) return;
    micStatusRef.current = message;
    setMicStatus(message);
  };

  function hardStopRecognition() {
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
        } catch (_) {}
        try {
          recognitionRef.current.onresult = null;
        } catch (_) {}
        try {
          recognitionRef.current.onerror = null;
        } catch (_) {}
        try {
          recognitionRef.current.onend = null;
        } catch (_) {}
        try {
          recognitionRef.current.abort?.();
        } catch (_) {}
        try {
          recognitionRef.current.stop?.();
        } catch (_) {}
      }
    } catch (_) {}
    recognizingRef.current = false;
    micForceStoppedRef.current = true;
    if (micRestartTimeoutRef.current) {
      clearTimeout(micRestartTimeoutRef.current);
      micRestartTimeoutRef.current = null;
    }
    recognitionRef.current = null;
  }

  function attachRecognitionHandlers(rec) {
    try {
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang =
        language ||
        (typeof navigator !== "undefined" && navigator.language
          ? navigator.language
          : "en-US");
      rec.maxAlternatives = 1;
    } catch (_) {}

    rec.onstart = () => {
      recognizingRef.current = true;
      micForceStoppedRef && (micForceStoppedRef.current = false);
      updateMicStatus(t("micListening"));
    };

    rec.onresult = (event) => {
      // Αν έχουμε ήδη transcript που τρέχει, μην περιμένεις final
      const hasInterim =
        event.results.length > 0 &&
        !event.results[event.results.length - 1].isFinal;

      // Πάρε πρώτα το πιο πρόσφατο interim (πιο γρήγορο)
      let idx = event.results.length - 1;
      const latestResult = event.results[idx];

      // Χρησιμοποίησε interim αν υπάρχει, αλλιώς ψάξε για final
      const chosen = latestResult;

      const transcript =
        chosen && chosen[0] && chosen[0].transcript ? chosen[0].transcript : "";

      // Split σε tokens ΑΜΑ υπάρχει τουλάχιστον μία λέξη
      const tokens = transcript.split(/\s+/).map(normalizeWord).filter(Boolean);
      if (tokens.length === 0) return;
      updateMicStatus(t("micDetected"));

      const isFinal = !!(chosen && chosen.isFinal);

      // ΝΕΟΣ ΚΩΔΙΚΑΣ: Για interim results, χρησιμοποίησε μόνο την τελευταία λέξη
      const tokensToUse =
        !isFinal && tokens.length > 1 ? tokens.slice(-1) : tokens;

      // mic activity indicator
      setIsSpeaking(true);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = setTimeout(() => setIsSpeaking(false), 1000);
      try {
        window.__lastMicResultTs = performance.now();
      } catch (_) {}
      lastMicResultTsRef.current = performance.now();

      const startIndex = Math.max(currentWordIndexRef.current + 1, 0);
      const currentLine = getLineIdxForWord(currentWordIndexRef.current);

      // Χρησιμοποίησε τα tokens που έχουμε υπολογίσει
      let nextIndex = findNextInLine(
        tokensToUse,
        startIndex,
        currentLine,
        6,
        2, // Always allow soft match για πιο aggressive matching
        true
      );
      if (nextIndex === -1)
        nextIndex = findNextInLine(
          tokensToUse,
          startIndex,
          currentLine,
          undefined,
          2,
          true // Always allow soft match
        );
      if (nextIndex === -1) {
        const { index } = tryAdvanceByTokens(tokensToUse, startIndex, {
          maxWindow: lookaheadWindow,
          maxSoftSkip: 2, // Πιο aggressive για αγγλικά
        });
        nextIndex = index;
      }
      if (nextIndex === -1) {
        // Re-sync when the speaker skipped a whole phrase: the local search
        // only covers the current line plus a short lookahead window, so if
        // the spoken text reappears further ahead it would never match and
        // the tracker gets stuck. Use the ACCUMULATED transcript of the
        // current result (not the single-token interim shortcut above) —
        // that way a skipped phrase can be matched even while reading
        // fluently without pauses (when final results are rare). A strong
        // word (>=4 chars) is required so filler pairs like "and the" never
        // trigger a jump. The search NEVER goes past paragraphLookahead
        // paragraphs ahead and is bounded to a short word window: a wrong
        // jump further into the script is unacceptable, so if there is no
        // local match we simply do not move.
        const resyncTokens = tokens.slice(-8);
        const skipWords = skipCoHostRef.current
          ? skippableWordsRef.current
          : null;
        const resyncEndIndex = getParagraphsEndIndex(
          startIndex - 1,
          paragraphLookahead
        );
        nextIndex = findResyncMatch(
          normalizedWordsRef.current,
          resyncTokens,
          startIndex,
          {
            skipWords,
            maxDistance: RESYNC_NEAR_DISTANCE,
            endIndex: resyncEndIndex,
            minNGram: 3,
            minExact: 2,
            minStrongLen: 4,
          }
        );
      }
      if (nextIndex !== -1) setCurrentWordIndex(nextIndex);
    };

    rec.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      const error = event.error || "unknown";
      updateMicStatus(
        (SPEECH_ERROR_KEYS[error] && t(SPEECH_ERROR_KEYS[error])) ||
          `${t("micUnknownError")}: ${error}. ${t("checkConsole")}`
      );

      if (FATAL_SPEECH_ERRORS.has(error)) {
        setIsListening(false);
        hardStopRecognition();
        return;
      }

      if (error === "no-speech") {
        if (isListeningRef.current && !micForceStoppedRef.current) {
          if (micRestartTimeoutRef.current)
            clearTimeout(micRestartTimeoutRef.current);
          micRestartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && !micForceStoppedRef.current)
              safeRestartRecognition(300);
          }, 0);
        }
      }
    };

    rec.onend = () => {
      recognizingRef.current = false;
      if (isListeningRef.current && !micForceStoppedRef.current) {
        if (micRestartTimeoutRef.current)
          clearTimeout(micRestartTimeoutRef.current);
        micRestartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current && !micForceStoppedRef.current)
            safeRestartRecognition(150);
        }, 0);
      }
    };

    return rec;
  }

  function safeRestartRecognition(delayMs = 150) {
    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
        } catch (_) {}
        try {
          recognitionRef.current.onerror = null;
        } catch (_) {}
        try {
          recognitionRef.current.onend = null;
        } catch (_) {}
        try {
          recognitionRef.current.abort?.();
        } catch (_) {}
        try {
          recognitionRef.current.stop?.();
        } catch (_) {}
      }
    } catch (_) {}
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const rec = new SpeechRecognition();
      recognitionRef.current = attachRecognitionHandlers(rec);
      setTimeout(() => {
        try {
          recognitionRef.current && recognitionRef.current.start();
        } catch (_) {}
      }, Math.max(0, delayMs));
    } catch (_) {}
  }

  // Keep the co-host-skip flag in a ref so recognition callbacks (created
  // once per mic session) always see the current value without re-binding.
  useEffect(() => {
    skipCoHostRef.current = skipCoHostLines;
  }, [skipCoHostLines]);

  const tryAdvanceByTokens = (
    tokens,
    startIndex,
    { maxWindow = lookaheadWindow, maxSoftSkip = 1 } = {}
  ) => {
    const candidates = tokens.filter(Boolean).slice(-3);
    if (candidates.length === 0) return { index: -1, nUsed: 0 };

    // Build the list of searchable word indices. Co-host words (">>" /
    // "@Name:" lines) are excluded when skipping is enabled, so the window
    // "flows over" another speaker's block no matter how long it is —
    // the window budget is only spent on the presenter's own words.
    // The search NEVER crosses into the next paragraph. Its matching is
    // deliberately weak (a single word, even soft/prefix-matched, is enough
    // to jump) so it can keep up in real time — safe within one paragraph,
    // but a repeated word near a paragraph break would otherwise win over
    // the real (unmatched, e.g. misheard) continuation. Crossing paragraphs
    // is left entirely to findResyncMatch below, which requires a 3-gram
    // with at least 2 exact matches and reaches paragraphLookahead
    // paragraphs ahead — strong enough evidence to trust further away.
    const skip = skipCoHostRef.current ? skippableWordsRef.current : null;
    const total = Math.min(
      normalizedWordsRef.current.length,
      getParagraphsEndIndex(startIndex - 1, 0) + 1
    );
    const searchIdx = [];
    for (
      let i = startIndex;
      i < total && searchIdx.length < Math.max(1, maxWindow);
      i++
    ) {
      if (skip && skip[i]) continue;
      searchIdx.push(i);
    }

    // Strict 3-gram then 2-gram equality (can jump further)
    for (let n = Math.min(3, candidates.length); n >= 2; n--) {
      const seq = candidates.slice(-n);
      for (const i of searchIdx) {
        let ok = true;
        for (let k = 0; k < n; k++) {
          const target = normalizedWordsRef.current[i + k];
          const token = seq[k];
          if (
            !target ||
            (skip && skip[i + k]) ||
            !tokensEqual(target, token)
          ) {
            ok = false;
            break;
          }
        }
        if (ok) return { index: i + (n - 1), nUsed: n };
      }
    }

    // 1-token equality but restrict jump (first few searchable words only)
    const softIdx = searchIdx.slice(0, Math.max(1, maxSoftSkip + 1));
    const t1 = candidates[candidates.length - 1];
    for (const i of softIdx) {
      const target = normalizedWordsRef.current[i];
      if (tokensEqual(target, t1)) return { index: i, nUsed: 1 };
    }

    // soft matches (prefix/contains) within soft limit
    for (const i of softIdx) {
      const target = normalizedWordsRef.current[i];
      if (tokensSoftMatch(target, t1)) return { index: i, nUsed: 1 };
    }

    return { index: -1, nUsed: 0 };
  };

  const getLineIdxForWord = (wIdx) => {
    if (wIdx < 0) return 0;
    const starts = lineStartIndexRef.current;
    let lineIdx = 0;
    for (let i = 0; i < starts.length; i++) {
      if (starts[i] <= wIdx) lineIdx = i;
      else break;
    }
    return lineIdx;
  };

  const getLineBounds = (lineIdx) => {
    const starts = lineStartIndexRef.current;
    const start = starts[lineIdx] ?? 0;
    const end = (starts[lineIdx + 1] ?? wordsRef.current.length) - 1;
    return { start, end };
  };

  // Word index where the paragraph `aheadCount` paragraphs after the one
  // containing `wIdx` ends (paragraphs are separated by empty lines).
  // aheadCount=0 -> end of the paragraph containing wIdx itself.
  // Used to bound both normal token-advance matching and phrase-skip
  // re-sync to a fixed number of paragraphs ahead, so a coincidental
  // repeated word/phrase far down the script can never win, while a
  // genuine forward match still has enough room to be found (getting
  // stuck at a paragraph boundary is worse than an occasional over-eager
  // jump within that bounded window).
  const getParagraphsEndIndex = (wIdx, aheadCount = 0) => {
    const lines = linesWordsRef.current;
    const starts = lineStartIndexRef.current;
    if (!starts || starts.length === 0) return wordsRef.current.length - 1;
    let i = getLineIdxForWord(wIdx);
    while (i < lines.length && lines[i].length > 0) i++;
    for (let remaining = aheadCount; remaining > 0 && i < lines.length; remaining--) {
      while (i < lines.length && lines[i].length === 0) i++;
      while (i < lines.length && lines[i].length > 0) i++;
    }
    const endLine = Math.min(i, lines.length) - 1;
    if (endLine < 0) return wordsRef.current.length - 1;
    return (starts[endLine + 1] ?? wordsRef.current.length) - 1;
  };

  const findNextInLine = (
    tokens,
    startIndex,
    lineIdx,
    headLimit,
    maxSoftSkip = 1,
    allowSoft = true
  ) => {
    // Never match inside a co-host line — fall through to the wider search
    // (tryAdvanceByTokens), which skips over it entirely.
    if (skipCoHostRef.current && lineIsCoHostRef.current[lineIdx])
      return -1;
    const { start: ls, end: leFull } = getLineBounds(lineIdx);
    const le = headLimit ? Math.min(ls + headLimit - 1, leFull) : leFull;
    const localStart = Math.max(startIndex, ls);
    const seq2 = tokens.slice(-2);
    if (seq2.length === 2) {
      for (let i = localStart; i <= le - 1; i++) {
        const a = normalizedWordsRef.current[i];
        const b = normalizedWordsRef.current[i + 1];
        if (a === seq2[0] && b === seq2[1]) {
          return i + 1;
        }
      }
    }
    const t = tokens[tokens.length - 1];
    if (t) {
      const softLimit = Math.min(le, localStart + Math.max(1, maxSoftSkip));
      for (let i = localStart; i <= softLimit; i++) {
        const w = normalizedWordsRef.current[i];
        if (w === t) return i;
      }
      if (allowSoft) {
        for (let i = localStart; i <= softLimit; i++) {
          const w = normalizedWordsRef.current[i];
          if (w && tokensSoftMatch(w, t)) return i;
        }
      }
    }
    return -1;
  };

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      try {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const rec = new SpeechRecognition();
        recognitionRef.current = attachRecognitionHandlers(rec);
      } catch (_) {}
    }

    return () => {
      try {
        recognitionRef.current && recognitionRef.current.stop();
      } catch (_) {}
    };
  }, []);

  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge, or press P for auto-scroll mode."
      );
      return;
    }

    if (isListening) {
      // Fully tear down immediately and release mic permissions
      setIsListening(false);
      setIsPlaying(false);
      updateMicStatus(t("micStopped"));
      hardStopRecognition();
    } else {
      try {
        // Recreate a fresh instance and start
        if (typeof micForceStoppedRef !== "undefined" && micForceStoppedRef) {
          try {
            micForceStoppedRef.current = false;
          } catch (_) {}
        }
        updateMicStatus(t("micStarting"));
        safeRestartRecognition(150);
        setIsListening(true);
        setIsPlaying(false);

        // Reset user interaction flag
        setUserIsInteracting(false);
        if (userInteractTimeoutRef.current) {
          clearTimeout(userInteractTimeoutRef.current);
        }

        setTimeout(() => {
          prevLineIdxRef.current = -1; // force first-centering
          prevVisualLineIdxRef.current = -1;
          const currentIdx =
            currentWordIndexRef.current >= 0 ? currentWordIndexRef.current : 0;
          scrollAnimTokenRef.current++;
          centerOnWordSmoothRef.current(currentIdx);
        }, 50);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  return {
    toggleListening,
    recognitionRef,
    isListeningRef,
    recognizingRef,
    safeRestartRecognition,
    getLineIdxForWord,
  };
}
