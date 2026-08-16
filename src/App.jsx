import { useState, useEffect, useLayoutEffect, useRef } from "react";
import CustomSlider from "./components/CustomSlider.jsx";
import { Icon } from "./constants/icons.jsx";
import { SPEECH_ERROR_KEYS, FATAL_SPEECH_ERRORS } from "./constants/speechErrors.js";
import { SUPPORT_PROMPTS_KEY, UI_LANGUAGE_KEY } from "./constants/keys.js";
import { UI_TEXT } from "./i18n/translations.js";
import { cleanMarkdownInline, markdownToTeleprompterLines, getLinePresentationStyle } from "./utils/markdown.js";
import {
  tokensEqual,
  tokensSoftMatch,
  normalizeWord,
  findResyncMatch,
} from "./utils/matching.js";
import { computeAutoIntervalMs } from "./utils/autoScroll.js";
import IconButton from "./components/IconButton.jsx";
import TeleprompterLine from "./components/TeleprompterLine.jsx";
import ResetConfirmModal from "./components/modals/ResetConfirmModal.jsx";
import ShortcutsHelpModal from "./components/modals/ShortcutsHelpModal.jsx";
import LanguageDropdown from "./components/LanguageDropdown.jsx";
import ScriptList from "./components/ScriptList.jsx";
import DeleteScriptConfirmModal from "./components/modals/DeleteScriptConfirmModal.jsx";
import SharedScriptImportModal from "./components/modals/SharedScriptImportModal.jsx";
import AddEditScriptModal from "./components/modals/AddEditScriptModal.jsx";
import useScriptLibrary from "./hooks/useScriptLibrary.js";
import useSettings from "./hooks/useSettings.js";
import useWebMCP from "./hooks/useWebMCP.js";
import SettingsPanel from "./components/SettingsPanel.jsx";


// Co-host speaker markers (GitHub #2): a line starting with ">>" or "@Name:"
// belongs to another speaker. It renders dimmed and voice tracking skips it,
// so shared scripts auto-jump to the presenter's next line no matter how long
// the co-host's part is.
const CO_HOST_LINE_RE = /^\s*(>>|@[^\s:]{1,30}:)/;

// Re-sync window (in words) used when the speaker skips a whole phrase and
// the local per-line search misses. Covers skipping a few phrases/paragraph;
// beyond that, a stricter far re-sync over the rest of the script kicks in.
const RESYNC_NEAR_DISTANCE = 200;

const DEFAULT_LINE_STYLE = { type: "paragraph", depth: 0 };
export default function SmartTeleprompter() {
  const [text, setText] =
    useState(`Welcome to Smart Teleprompter the free, open-source teleprompter application that uses real-time speech recognition to automatically follow your voice as you read.

⚠️ IMPORTANT COMPATIBILITY NOTES:
• For BEST EXPERIENCE: Use Desktop/Laptop with Chrome browser
• iPhone/iPad (iOS 14.5+): Voice recognition works in Safari but may pause after each phrase
• Android: Voice recognition may work but performance varies
• Mobile browsers have limited Web Speech API support

QUICK START
Press the microphone button (or V) to start voice tracking. The app will highlight words as you speak them and smoothly scroll to keep your current position centered on screen.

💾 DATA STORAGE
Your settings and script content are automatically saved to your browser's localStorage. This means:
• Your preferences persist between sessions
• Your script is preserved when you reload the page
• Data is stored locally on your device (no cloud storage)

KEYBOARD SHORTCUTS
V - Start/Stop microphone
P - Play/Pause auto-scroll
H - Toggle word highlighting
R - Reset to beginning
L - Language selection
E - Settings menu
S - Script editor
B - My Scripts library
F - Fullscreen mode
M - Mirror text horizontally
? - Show keyboard shortcuts

KEY FEATURES
- Voice-controlled scrolling with 20+ language support
- Script library — save, edit, and load up to 50 scripts with per-script language
- Adjustable font size, colors, and spacing
- Customizable scroll speed and text positioning
- Camera aim indicator for perfect alignment
- Import scripts from .txt or .md files
- Horizontal mirroring for teleprompter hardware
- Paragraph and word highlighting modes

SUPPORTED LANGUAGES
🇺🇸 English (US) • 🇬🇧 English (UK) • 🇪🇸 Spanish (Spain) • 🇲🇽 Spanish (Mexico) • 🇫🇷 French • 🇩🇪 German • 🇮🇹 Italian • 🇧🇷 Portuguese (Brazil) • 🇵🇹 Portuguese (Portugal) • 🇷🇺 Russian • 🇨🇳 Chinese • 🇯🇵 Japanese • 🇰🇷 Korean • 🇸🇦 Arabic • 🇮🇳 Hindi • 🇹🇷 Turkish • 🇳🇱 Dutch • 🇬🇷 Greek • 🇵🇱 Polish • 🇸🇪 Swedish

TIPS FOR BEST RESULTS
- Use Chrome browser on Desktop/Laptop for optimal performance
- iPhone/iPad users: Voice recognition works on iOS 14.5+, but auto-scroll mode (P key) is more reliable
- Android users: Voice recognition may work but desktop recommended
- External microphones provide better accuracy than built-in mics
- Minimize background noise for improved tracking
- Stable internet connection required (5+ Mbps recommended)
- Speak at natural pace with clear pronunciation

This project is completely free and open source. If you find it useful, consider supporting development at smarttelepromter.com

Happy recording!`);

  const [textFormat, setTextFormat] = useState("plain");
  const {
    fontSize, setFontSize,
    margin, setMargin,
    lineHeight, setLineHeight,
    scrollSpeed, setScrollSpeed,
    bgColor, setBgColor,
    textColor, setTextColor,
    highlightColor, setHighlightColor,
    followEnabled, setFollowEnabled,
    lookaheadWindow, setLookaheadWindow,
    paragraphLookahead, setParagraphLookahead,
    centerPaddingVh, setCenterPaddingVh,
    showAim, setShowAim,
    aimOffsetX, setAimOffsetX,
    aimOffsetY, setAimOffsetY,
    aimStyle, setAimStyle,
    aimColor, setAimColor,
    showListeningIndicator, setShowListeningIndicator,
    skipCoHostLines, setSkipCoHostLines,
    textOpacity, setTextOpacity,
    aimOpacity, setAimOpacity,
    uiOpacity, setUiOpacity,
    paragraphSpacingPx, setParagraphSpacingPx,
    sidePaddingVw, setSidePaddingVw,
    textAlignStyle, setTextAlignStyle,
    mirrorX, setMirrorX,
    toolbarPosition, setToolbarPosition,
    language, setLanguage,
    showSupportPrompts, setShowSupportPrompts,
    uiLanguage, setUiLanguage,
    paragraphHighlightOpacity, setParagraphHighlightOpacity,
    defaultSettings,
    resetSettingsToDefault,
  } = useSettings({ text, setText, textFormat, setTextFormat });

  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userIsInteracting, setUserIsInteracting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCenterLine, setShowCenterLine] = useState(false);
  const [showHighlight, setShowHighlight] = useState(true);
  const [micStatus, setMicStatus] = useState("");
  const [lineIsCoHost, setLineIsCoHost] = useState([]);
  // Toolbar overflow hints (mobile): which directions have hidden icons
  const [toolbarHints, setToolbarHints] = useState({
    left: false,
    right: false,
  });
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const languageBtnRef = useRef(null);
  const [languageMenuPos, setLanguageMenuPos] = useState({ top: 0, left: 0 });
  const [showSupportMessage, setShowSupportMessage] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "smartTeleprompterSupportMessageDismissed"
      );
      return saved !== "true";
    } catch (error) {
      console.error("Failed to load support message state:", error);
      return true;
    }
  });
  const [isIOS, setIsIOS] = useState(false);
  const [iosBannerDismissed, setIosBannerDismissed] = useState(false);
  const t = (key) => UI_TEXT[uiLanguage]?.[key] || UI_TEXT.en[key] || key;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const languagesList = [
    { code: "en-US", label: "🇺🇸 English (US)" },
    { code: "en-GB", label: "🇬🇧 English (UK)" },
    { code: "es-ES", label: "🇪🇸 Español (España)" },
    { code: "es-MX", label: "🇲🇽 Español (México)" },
    { code: "fr-FR", label: "🇫🇷 Français" },
    { code: "de-DE", label: "🇩🇪 Deutsch" },
    { code: "it-IT", label: "🇮🇹 Italiano" },
    { code: "pt-BR", label: "🇧🇷 Português (Brasil)" },
    { code: "pt-PT", label: "🇵🇹 Português (Portugal)" },
    { code: "ru-RU", label: "🇷🇺 Русский" },
    { code: "zh-CN", label: "🇨🇳 中文 (简体)" },
    { code: "ja-JP", label: "🇯🇵 日本語" },
    { code: "ko-KR", label: "🇰🇷 한국어" },
    { code: "ar-SA", label: "🇸🇦 العربية" },
    { code: "hi-IN", label: "🇮🇳 हिन्दी" },
    { code: "tr-TR", label: "🇹🇷 Türkçe" },
    { code: "nl-NL", label: "🇳🇱 Nederlands" },
    { code: "el-GR", label: "🇬🇷 Ελληνικά" },
    { code: "pl-PL", label: "🇵🇱 Polski" },
    { code: "sv-SE", label: "🇸🇪 Svenska" },
  ];
  const [linesWords, setLinesWords] = useState([]);
  const [lineStartIndex, setLineStartIndex] = useState([]);
  const [lineStyles, setLineStyles] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const {
    MAX_SCRIPTS,
    showScriptList,
    setShowScriptList,
    savedScripts,
    showAddScript,
    setShowAddScript,
    editScriptId,
    addScriptName,
    setAddScriptName,
    addScriptText,
    setAddScriptText,
    addScriptLanguage,
    setAddScriptLanguage,
    scriptFormTouched,
    deleteScriptConfirm,
    setDeleteScriptConfirm,
    pendingSharedScript,
    setPendingSharedScript,
    shareBusyId,
    openAddScriptModal,
    openEditScriptModal,
    saveScript,
    loadScript,
    shareScript,
    confirmImportSharedScript,
    confirmDeleteScript,
  } = useScriptLibrary({ text, setText, setLanguage });
  const [extraBottomSpacePx, setExtraBottomSpacePx] = useState(0);

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const wordsRef = useRef([]);
  const normalizedWordsRef = useRef([]);
  const linesRawRef = useRef([]);
  const linesWordsRef = useRef([]);
  const lineStartIndexRef = useRef([]);
  const toolbarScrollRef = useRef(null);
  // Co-host markers: per-line + per-word skip flags, and a live ref for the
  // setting (refs so the speech-recognition closures always see fresh values)
  const lineIsCoHostRef = useRef([]);
  const skippableWordsRef = useRef([]);
  const skipCoHostRef = useRef(true);
  const isListeningRef = useRef(false);
  const currentWordIndexRef = useRef(-1);
  const textContainerRef = useRef(null);
  const autoScrollInterval = useRef(null);
  const autoRafIdRef = useRef(null);
  const autoLastTsRef = useRef(0);
  const scrollAnimTokenRef = useRef(0);
  const userInteractTimeoutRef = useRef(null);
  const speakingTimeoutRef = useRef(null);
  const hasInitialCenterRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const prevLineIdxRef = useRef(-1);
  const prevVisualLineIdxRef = useRef(-1);
  const lastScrollTopRef = useRef(0);
  const stagnantStepsRef = useRef(0);
  const recognizingRef = useRef(false);
  const lastMicResultTsRef = useRef(performance.now());
  const micForceStoppedRef = useRef(false);
  const micRestartTimeoutRef = useRef(null);
  const micStatusRef = useRef("");

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

  // Toolbar overflow hints: on narrow screens the toolbar scrolls
  // horizontally, but nothing indicated that more icons exist off-screen.
  // Track scroll position and show tappable arrows + edge fades.
  const updateToolbarHints = () => {
    const el = toolbarScrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setToolbarHints((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right }
    );
  };

  const scrollToolbar = (dir) => {
    const el = toolbarScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(150, el.clientWidth * 0.6), behavior: "smooth" });
  };

  useEffect(() => {
    updateToolbarHints();
    window.addEventListener("resize", updateToolbarHints);
    return () => window.removeEventListener("resize", updateToolbarHints);
  }, []);

  // Sync body background with setting
  useEffect(() => {
    try {
      if (typeof document !== "undefined" && document.body) {
        document.body.style.backgroundColor = bgColor;
        document.body.style.background = bgColor;
      }
    } catch (_) {}
  }, [bgColor]);

  const handleFileUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    try {
      if (ext === "txt" || ext === "md" || ext === "markdown") {
        const txt = await file.text();
        setTextFormat(ext === "txt" ? "plain" : "markdown");
        setText(txt);
        setShowEditor(true);
        setAddScriptName(file.name.replace(/\.(txt|md|markdown)$/i, ""));
        setAddScriptText(txt);
        setAddScriptLanguage(language);
        setEditScriptId(null);
        setScriptFormTouched(false);
        setShowAddScript(true);
      } else {
        alert(t("supportedFileTypes"));
      }
    } catch (e) {
      console.error(e);
      alert(t("fileLoadFailed"));
    } finally {
      event.target.value = "";
    }
  };

  const FileButton = ({ onFile }) => {
    const inputRef = useRef(null);
    return (
      <IconButton uiOpacity={uiOpacity}
        onClick={() => inputRef.current && inputRef.current.click()}
        ariaLabel="Open File"
        tooltipTitle={t("openFile")}
        tooltipDesc={t("importFileTip")}
      >
        <Icon name={"arrow-up-tray"} />
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.markdown,text/plain,text/markdown"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </IconButton>
    );
  };

  useEffect(() => {
    const parsedLines =
      textFormat === "markdown"
        ? markdownToTeleprompterLines(text)
        : text.split(/\r?\n/).map((line) => ({
            text: line,
            style: { ...DEFAULT_LINE_STYLE },
          }));
    const lines = parsedLines.map((line) => line.text);
    const styles = parsedLines.map((line) => line.style);
    linesRawRef.current = lines;
    const linesWords = lines.map((ln) =>
      ln.split(/\s+/).filter((w) => w.trim().length > 0)
    );
    linesWordsRef.current = linesWords;

    // Which lines belong to a co-host (">>" / "@Name:" prefix)
    const lineIsCoHostArr = lines.map((ln) => CO_HOST_LINE_RE.test(ln));
    lineIsCoHostRef.current = lineIsCoHostArr;

    const flatWords = [];
    const starts = [];
    const skippable = [];
    for (let i = 0; i < linesWords.length; i++) {
      starts.push(flatWords.length);
      for (const w of linesWords[i]) {
        flatWords.push(w);
        skippable.push(lineIsCoHostArr[i]);
      }
    }
    lineStartIndexRef.current = starts;
    wordsRef.current = flatWords;
    normalizedWordsRef.current = flatWords.map(normalizeWord);
    skippableWordsRef.current = skippable;
    setLinesWords(linesWords);
    setLineStartIndex(starts);
    setLineStyles(styles);
    setLineIsCoHost(lineIsCoHostArr);
  }, [text, textFormat]);

  useEffect(() => {
    if (!hasInitialCenterRef.current && linesWords && linesWords.length > 0) {
      setTimeout(() => {
        if (textContainerRef.current) {
          centerOnWordIndex(0, "auto");
          requestAnimationFrame(() => centerOnWordIndex(0, "smooth"));
          hasInitialCenterRef.current = true;
        }
      }, 0);
    }
  }, [linesWords]);

  const centerOnWordIndex = (wIdx, behavior = "smooth") => {
    if (wIdx == null || wIdx < 0) return;
    const container = textContainerRef.current;
    const wordElement = document.getElementById(`word-${wIdx}`);
    if (!container || !wordElement) return;
    const containerRect = container.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    const delta = wordRect.top - containerRect.top; // position of word within container viewport
    const anchorY = window.innerHeight * (centerPaddingVh / 100); // anchor by settings relative to window
    const targetWithinContainer = anchorY - containerRect.top;
    const newTop = container.scrollTop + delta - targetWithinContainer;
    const topVal = Math.max(0, newTop);
    // Also compute window scroll fallback
    const winTop =
      (window.scrollY || window.pageYOffset || 0) + (wordRect.top - anchorY);
    programmaticScrollRef.current = true;
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: topVal, behavior });
    } else {
      container.scrollTop = topVal;
    }
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 0);
  };

  const centerOnLineStart = (lineIdx, behavior = "smooth") => {
    if (lineIdx == null || lineIdx < 0) return;
    const container = textContainerRef.current;
    const lineElement = document.getElementById(`line-${lineIdx}`);
    if (!container || !lineElement) return;
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineElement.getBoundingClientRect();
    const delta = lineRect.top - containerRect.top;
    const anchorY = window.innerHeight * (centerPaddingVh / 100);
    const targetWithinContainer = anchorY - containerRect.top;
    const newTop = container.scrollTop + delta - targetWithinContainer;
    const topVal = Math.max(0, newTop);
    const winTop =
      (window.scrollY || window.pageYOffset || 0) + (lineRect.top - anchorY);
    programmaticScrollRef.current = true;
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: topVal, behavior });
    } else {
      container.scrollTop = topVal;
    }
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 0);
  };

  const getTargetTopForLine = (lineIdx) => {
    const container = textContainerRef.current;
    const lineElement = document.getElementById(`line-${lineIdx}`);
    if (!container || !lineElement) return null;
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineElement.getBoundingClientRect();
    const delta = lineRect.top - containerRect.top;
    const anchorY = window.innerHeight * (centerPaddingVh / 100);
    const targetWithinContainer = anchorY - containerRect.top;
    const newTop = container.scrollTop + delta - targetWithinContainer;
    const topVal = Math.max(0, newTop);
    return { useWindow: false, topVal, winTop: 0 };
  };

  const smoothScrollTo = (useWindow, toTop, durationMs = 900) => {
    // Cancel any previous animation by advancing the token
    const myToken = ++scrollAnimTokenRef.current;
    const containerEl = textContainerRef.current;
    const start = useWindow
      ? window.scrollY || window.pageYOffset || 0
      : containerEl.scrollTop;
    // Clamp target within scrollable range to avoid bottom plateaus
    const maxPos = useWindow
      ? Math.max(
          0,
          (document.scrollingElement || document.documentElement).scrollHeight -
            window.innerHeight
        )
      : Math.max(0, containerEl.scrollHeight - containerEl.clientHeight);
    const target = Math.max(0, Math.min(toTop, maxPos));
    const change = target - start;
    const startTime = performance.now();
    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const step = (now) => {
      // Abort if a new animation started
      if (myToken !== scrollAnimTokenRef.current) {
        // ensure we never leave the flag stuck to true
        programmaticScrollRef.current = false;
        return;
      }
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const val = start + change * easeInOutQuad(t);
      programmaticScrollRef.current = true;
      if (useWindow) {
        window.scrollTo(0, Math.max(0, val));
      } else {
        containerEl.scrollTop = Math.max(0, val);
      }
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        programmaticScrollRef.current = false;
      }
    };
    requestAnimationFrame(step);
  };

  const centerOnLineStartSmooth = (lineIdx) => {
    const target = getTargetTopForLine(lineIdx);
    if (!target) return;
    smoothScrollTo(
      target.useWindow,
      target.useWindow ? target.winTop : target.topVal,
      900
    );
  };

  const getTargetTopForWord = (wIdx) => {
    const container = textContainerRef.current;
    const wordElement = document.getElementById(`word-${wIdx}`);
    if (!container || !wordElement) return null;
    const containerRect = container.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    const delta = wordRect.top - containerRect.top;
    const anchorY = window.innerHeight * (centerPaddingVh / 100);
    const targetWithinContainer = anchorY - containerRect.top;
    const newTop = container.scrollTop + delta - targetWithinContainer;
    const topVal = Math.max(0, newTop);
    return { useWindow: false, topVal, winTop: 0 };
  };

  const centerOnWordSmooth = (wIdx, durationMs = 900) => {
    const container = textContainerRef.current;
    const target = getTargetTopForWord(wIdx);
    if (!target || !container) return;
    const maxPos = Math.max(0, container.scrollHeight - container.clientHeight);
    if (target.topVal > maxPos - 4) {
      // Not enough room to reach anchor; add spacer then retry next tick
      setExtraBottomSpacePx((prev) => Math.min(4000, Math.max(prev, 1600)));
      setTimeout(() => centerOnWordSmooth(wIdx, durationMs), 0);
      return;
    }
    smoothScrollTo(false, target.topVal, durationMs);
  };

  const getVisualLineIdxForWord = (wIdx) => {
    const container = textContainerRef.current;
    const wordElement = document.getElementById(`word-${wIdx}`);
    if (!container || !wordElement) return -1;
    const containerRect = container.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    const contentY = container.scrollTop + (wordRect.top - containerRect.top);
    const approxLinePx = Math.max(1, fontSize * lineHeight * 1.0);
    return Math.floor(contentY / approxLinePx);
  };

  const getWordAnchorDelta = (wIdx) => {
    const el = document.getElementById(`word-${wIdx}`);
    if (!el) return 0;
    const wordRect = el.getBoundingClientRect();
    const anchorY = window.innerHeight * (centerPaddingVh / 100);
    return wordRect.top - anchorY;
  };

  useEffect(() => {
    const loop = (ts) => {
      if (!isPlaying || isListening) {
        autoRafIdRef.current = null;
        return;
      }
      const stepMs = computeAutoIntervalMs(scrollSpeed);
      if (!autoLastTsRef.current) autoLastTsRef.current = ts;
      if (ts - autoLastTsRef.current >= stepMs) {
        const curNow =
          currentWordIndexRef.current < 0 ? 0 : currentWordIndexRef.current;
        let next = Math.min(curNow + 1, wordsRef.current.length - 1);
        // If we're already at the end of the text, stop; otherwise always advance
        if (curNow >= wordsRef.current.length - 1) {
          if (autoRafIdRef.current) {
            cancelAnimationFrame(autoRafIdRef.current);
            autoRafIdRef.current = null;
          }
          setIsPlaying(false);
          return;
        }
        setCurrentWordIndex(next);
        // cancel ongoing scroll and start a fresh center to word
        scrollAnimTokenRef.current++;
        // Use our smooth scroller; it writes to container scrollTop
        centerOnWordSmooth(next, Math.max(600, stepMs - 50));
        autoLastTsRef.current = ts;

        // Detect stagnation: if scrollTop hasn't changed for several steps, force a small nudge
        const el = textContainerRef.current;
        if (el) {
          const nowTop = el.scrollTop;
          if (Math.abs(nowTop - lastScrollTopRef.current) < 0.5) {
            stagnantStepsRef.current += 1;
          } else {
            stagnantStepsRef.current = 0;
          }
          lastScrollTopRef.current = nowTop;
          if (stagnantStepsRef.current >= 4) {
            // force 1px nudge to break out of rounding plateaus
            el.scrollTop = Math.min(el.scrollHeight, nowTop + 1);
            stagnantStepsRef.current = 0;
          }
        }
      }
      autoRafIdRef.current = requestAnimationFrame(loop);
    };

    if (isPlaying && !isListening) {
      autoLastTsRef.current = 0;
      if (!autoRafIdRef.current) {
        autoRafIdRef.current = requestAnimationFrame(loop);
      }
    } else {
      if (autoRafIdRef.current) {
        cancelAnimationFrame(autoRafIdRef.current);
        autoRafIdRef.current = null;
        autoLastTsRef.current = 0;
      }
    }
    return () => {
      if (autoRafIdRef.current) {
        cancelAnimationFrame(autoRafIdRef.current);
        autoRafIdRef.current = null;
        autoLastTsRef.current = 0;
      }
    };
  }, [isPlaying, isListening, scrollSpeed]);

  useEffect(() => {
    const active = isListening || isPlaying;
    if (!active && !followEnabled) return;
    if (currentWordIndex < 0 || !textContainerRef.current) return;

    const logicalLineIdx = getLineIdxForWord(currentWordIndex);
    const visualLineIdx = getVisualLineIdxForWord(currentWordIndex);

    const logicalChanged = logicalLineIdx !== prevLineIdxRef.current;
    const visualChanged = visualLineIdx !== prevVisualLineIdxRef.current;

    prevLineIdxRef.current = logicalLineIdx;
    prevVisualLineIdxRef.current = visualLineIdx;

    if (logicalChanged || visualChanged) {
      scrollAnimTokenRef.current++;
      centerOnWordSmooth(currentWordIndex);
    }
  }, [
    currentWordIndex,
    followEnabled,
    isListening,
    isPlaying,
    fontSize,
    lineHeight,
    centerPaddingVh,
  ]);

  // Watchdog: if active and the anchor drifts far from the current word, force re-center
  useEffect(() => {
    let rafId = null;
    let lastResultTs = performance.now();
    try {
      if (typeof window.__lastMicResultTs === "number")
        lastResultTs = window.__lastMicResultTs;
      else window.__lastMicResultTs = lastResultTs;
    } catch (_) {}
    const tick = () => {
      const active = isListening || isPlaying;
      if (active && !programmaticScrollRef.current) {
        const idx = currentWordIndexRef.current;
        if (idx >= 0) {
          const approxLinePx = Math.max(1, fontSize * lineHeight * 1.0);
          const delta = Math.abs(getWordAnchorDelta(idx));
          if (delta > approxLinePx * 0.9) {
            scrollAnimTokenRef.current++;
            centerOnWordSmooth(idx, 650);
          }
        }
      }
      // Microphone watchdog: if listening but no result for a while, pause or restart
      if (isListeningRef.current) {
        const now = performance.now();
        try {
          if (typeof window.__lastMicResultTs === "number")
            lastResultTs = window.__lastMicResultTs;
        } catch (_) {}
        if (now - lastResultTs > 4000 && recognizingRef.current) {
          // if no audio detected for 4s, stop gracefully to release mic
          try {
            recognitionRef.current.stop?.();
          } catch (_) {}
        } else if (now - lastResultTs > 5000 && !recognizingRef.current) {
          // if stopped due to silence, restart cleanly
          safeRestartRecognition(200);
          lastResultTs = performance.now();
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isListening, isPlaying, fontSize, lineHeight, centerPaddingVh]);

  useEffect(() => {
    const el = textContainerRef.current;
    if (!el) return;
    let isTouching = false;
    let isWheelScrolling = false;
    const markInteract = () => {
      if (isListening || isPlaying) return;

      setUserIsInteracting(true);
      if (userInteractTimeoutRef.current)
        clearTimeout(userInteractTimeoutRef.current);
      userInteractTimeoutRef.current = setTimeout(
        () => setUserIsInteracting(false),
        1200
      );
    };
    const onScroll = () => {
      if (programmaticScrollRef.current) return;
      // If active modes are on, ignore manual scroll so it never stalls
      if (isListening || isPlaying) return;
      markInteract();
    };
    const onWheel = () => {
      isWheelScrolling = true;
      markInteract();
    };
    const onTouchStart = () => {
      isTouching = true;
      markInteract();
    };
    const onTouchMove = () => {
      if (isTouching) markInteract();
    };
    const onTouchEnd = () => {
      isTouching = false;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      if (userInteractTimeoutRef.current)
        clearTimeout(userInteractTimeoutRef.current);
    };
  }, [isPlaying, isListening]);

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
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

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
          centerOnWordSmooth(currentIdx);
        }, 50);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  const toggleAutoPlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (nextPlaying && wordsRef.current.length > 0) {
      // Reset user interaction flag
      setUserIsInteracting(false);
      if (userInteractTimeoutRef.current) {
        clearTimeout(userInteractTimeoutRef.current);
      }

      if (currentWordIndex < 0) {
        setCurrentWordIndex(0);
        setTimeout(() => {
          prevLineIdxRef.current = -1; // force first-centering
          prevVisualLineIdxRef.current = -1;
          scrollAnimTokenRef.current++;
          centerOnWordSmooth(0);
          // init stagnation trackers
          const el = textContainerRef.current;
          if (el) lastScrollTopRef.current = el.scrollTop;
          stagnantStepsRef.current = 0;
        }, 50);
      } else {
        setTimeout(() => {
          prevVisualLineIdxRef.current = -1;
          scrollAnimTokenRef.current++;
          centerOnWordSmooth(currentWordIndexRef.current);
          const el = textContainerRef.current;
          if (el) lastScrollTopRef.current = el.scrollTop;
          stagnantStepsRef.current = 0;
        }, 50);
      }
    }
    if (!nextPlaying && autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
    if (!nextPlaying) setIsSpeaking(false);
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error("Error attempting to exit fullscreen:", err);
        });
    }
  };

  // Global keyboard shortcuts (after handlers are defined)
  // Detect iOS
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  // Load language from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const savedLanguage = localStorage.getItem("smartTeleprompterLanguage");
        if (savedLanguage && savedLanguage.trim()) {
          console.log("Language loaded from localStorage:", savedLanguage);
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language from localStorage:", error);
      }
    }
  }, []); // Run only once after mount

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage && language) {
      try {
        localStorage.setItem("smartTeleprompterLanguage", language);
        console.log("Language saved to localStorage:", language);
      } catch (error) {
        console.error("Failed to save language to localStorage:", error);
      }
    }
  }, [language]);

  // Save support message dismissal to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(
          "smartTeleprompterSupportMessageDismissed",
          showSupportMessage ? "false" : "true"
        );
        console.log(
          "Support message state saved to localStorage:",
          showSupportMessage
        );
      } catch (error) {
        console.error(
          "Failed to save support message state to localStorage:",
          error
        );
      }
    }
  }, [showSupportMessage]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close language selector if clicking outside (but not on language options)
      if (
        showLanguageSelector &&
        languageBtnRef.current &&
        !languageBtnRef.current.contains(event.target) &&
        !event.target.closest("[data-language-dropdown]")
      ) {
        setShowLanguageSelector(false);
      }

      // Close settings/editor panels if clicking outside
      if (
        (showSettings || showEditor) &&
        !event.target.closest('[data-panel="settings"]')
      ) {
        setShowSettings(false);
        setShowEditor(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageSelector, showSettings, showEditor]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag =
        e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || e.isComposing) return;
      if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        toggleListening();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        toggleAutoPlay();
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setShowHighlight((v) => !v);
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        resetPosition();
        return;
      }
      if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        setShowLanguageSelector((v) => !v);
        // recompute anchor position
        if (languageBtnRef.current) {
          const rect = languageBtnRef.current.getBoundingClientRect();
          setLanguageMenuPos({ top: rect.bottom + 8, left: rect.left });
        }
        return;
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setShowEditor((v) => !v);
        return;
      }
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        setShowEditor(true);
        setShowScriptList((v) => !v);
        return;
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setShowSettings((v) => !v);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setMirrorX((v) => !v);
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        if (pendingSharedScript) { setPendingSharedScript(null); }
        else if (deleteScriptConfirm) { setDeleteScriptConfirm(null); }
        else if (showAddScript) { setShowAddScript(false); }
        else if (showShortcuts) { setShowShortcuts(false); }
        else if (showResetConfirm) { setShowResetConfirm(false); }
        else if (showEditor) { setShowEditor(false); }
        else if (showSettings) { setShowSettings(false); }
        else return;
        e.preventDefault();
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isListening, isPlaying, showHighlight, showShortcuts]);

  // Recompute language menu position when opened
  useEffect(() => {
    if (showLanguageSelector && languageBtnRef.current) {
      const rect = languageBtnRef.current.getBoundingClientRect();
      setLanguageMenuPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, [showLanguageSelector]);

  const resetPosition = () => {
    // Stop autoplay loops
    if (autoRafIdRef.current) {
      cancelAnimationFrame(autoRafIdRef.current);
      autoRafIdRef.current = null;
    }
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
      autoScrollInterval.current = null;
    }
    autoLastTsRef.current = 0;

    // Stop listening
    try {
      if (recognitionRef.current) recognitionRef.current.stop();
    } catch (_) {}
    setIsListening(false);
    setIsPlaying(false);

    // Reset indices and trackers
    prevLineIdxRef.current = -1;
    prevVisualLineIdxRef.current = -1;
    currentWordIndexRef.current = -1;
    setCurrentWordIndex(-1);

    // Hard scroll to top (container and window)
    programmaticScrollRef.current = true;
    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 0);
  };

  // ---- WebMCP: expose teleprompter controls to browser AI agents ----
  useWebMCP({
    setText,
    setLanguage,
    setScrollSpeed,
    setFontSize,
    toggleAutoPlay,
    toggleListening,
    resetPosition,
    loadScript,
    savedScripts,
    isPlaying,
    isListening,
    language,
    scrollSpeed,
    fontSize,
  });

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: bgColor,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Center Line Indicator */}
      {showCenterLine && (
        <div
          style={{
            position: "fixed",
            top: `${centerPaddingVh}vh`,
            left: 0,
            right: 0,
            height: "2px",
            backgroundColor: "#ff0000",
            zIndex: 9999,
            pointerEvents: "none",
            opacity: 0.8,
          }}
        />
      )}

      {/* Toolbar */}
      <div
        style={{
          position: "fixed",
          top: toolbarPosition === "top" ? 0 : "auto",
          bottom: toolbarPosition === "bottom" ? 0 : "auto",
          left: 0,
          right: 0,
          background: `rgba(0,0,0,${Math.min(1, uiOpacity)})`,
          padding: "15px",
          zIndex: 1,
          borderBottom: toolbarPosition === "top"
            ? "2px solid rgba(255,255,255,0.1)"
            : "none",
          borderTop: toolbarPosition === "bottom"
            ? "2px solid rgba(255,255,255,0.1)"
            : "none",
        }}
      >
        {toolbarHints.left && (
          <button
            onClick={() => scrollToolbar(-1)}
            aria-label="Scroll toolbar left"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "36px",
              border: "none",
              cursor: "pointer",
              zIndex: 2,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingLeft: "4px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {toolbarHints.right && (
          <button
            onClick={() => scrollToolbar(1)}
            aria-label="Scroll toolbar right"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "36px",
              border: "none",
              cursor: "pointer",
              zIndex: 2,
              background:
                "linear-gradient(to left, rgba(0,0,0,0.95) 45%, rgba(0,0,0,0))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "4px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <div
          className="toolbar-buttons"
          ref={toolbarScrollRef}
          onScroll={updateToolbarHints}
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: "5px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.3) transparent",
            justifyContent: "flex-start",
          }}
        >
          <IconButton uiOpacity={uiOpacity}
            onClick={toggleListening}
            ariaLabel="Microphone"
            tooltipTitle={`${t("microphone")} (V)`}
            tooltipDesc={t("microphoneTip")}
            style={{ background: isListening ? "#d32f2f" : "#0f0f0f" }}
          >
            {isListening ? (
              // Stop square icon (record/stop style)
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  x="7"
                  y="7"
                  width="10"
                  height="10"
                  rx="2"
                  ry="2"
                  fill="white"
                />
              </svg>
            ) : (
              <Icon name={"microphone"} />
            )}
          </IconButton>

          {/* Language selector toggle */}
          <span ref={languageBtnRef}>
            <IconButton uiOpacity={uiOpacity}
              onClick={() => {
                setShowLanguageSelector((v) => !v);
                if (languageBtnRef.current) {
                  const rect = languageBtnRef.current.getBoundingClientRect();
                  setLanguageMenuPos({ top: rect.bottom + 8, left: rect.left });
                }
              }}
              ariaLabel="Language"
              tooltipTitle={`${t("language")} (L)`}
              tooltipDesc={t("languageTip")}
              style={{ background: "#0f0f0f", width: "auto", padding: "0 8px" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 0 20" />
                  <path d="M12 2a15.3 15.3 0 0 0 0 20" />
                </svg>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "white",
                  }}
                >
                  {language.split("-")[0].toUpperCase()}
                </span>
              </div>
            </IconButton>
          </span>

          {/* Mirror X */}
          <IconButton uiOpacity={uiOpacity}
            onClick={() => setMirrorX((v) => !v)}
            ariaLabel="Mirror X"
            tooltipTitle={`${t("mirror")} (M)`}
            tooltipDesc={t("mirrorTip")}
            style={{ background: mirrorX ? "#2e7d32" : "#0f0f0f" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 40 40"
              fill="white"
            >
              <path d="M15.875 35H7.792q-1.125 0-1.959-.833Q5 33.333 5 32.208V7.792q0-1.125.833-1.959Q6.667 5 7.792 5h8.083v2.792H7.792v24.416h8.083Zm2.792 3.333V1.667h2.791v36.666ZM32.208 7.792h-.375V5h.375q1.125 0 1.959.833.833.834.833 1.959v.375h-2.792Zm0 14.291v-4.166H35v4.166Zm0 12.917h-.375v-2.792h.375v-.375H35v.375q0 1.125-.833 1.959-.834.833-1.959.833Zm0-19.875v-4.167H35v4.167Zm0 13.917v-4.167H35v4.167Zm-8 5.958v-2.792h4.834V35Zm0-27.208V5h4.834v2.792Z"></path>
            </svg>
          </IconButton>

          {/* Language dropdown */}
          {showLanguageSelector && (
            <LanguageDropdown
              languagesList={languagesList}
              language={language}
              menuPos={languageMenuPos}
              onSelect={(code) => {
                setLanguage(code);
                setShowLanguageSelector(false);
                try {
                  if (recognitionRef.current)
                    recognitionRef.current.lang = code;
                } catch (_) {}
                if (isListeningRef.current) {
                  // restart with new language
                  safeRestartRecognition(150);
                }
              }}
            />
          )}

          {/* Upload button hidden per request */}

          {/* Editor button will be placed right before Settings */}

          <IconButton uiOpacity={uiOpacity}
            onClick={toggleAutoPlay}
            ariaLabel="Auto Scroll"
            tooltipTitle={`${t("autoScroll")} (P)`}
            tooltipDesc={t("playPause")}
            style={{ background: isPlaying ? "#ff9800" : "#0f0f0f" }}
          >
            <Icon name={isPlaying ? "pause" : "play"} />
          </IconButton>

          {/* Follow Mode button removed per request */}

          {/* Toggle highlight button */}
          <IconButton uiOpacity={uiOpacity}
            onClick={() => setShowHighlight((v) => !v)}
            ariaLabel="Toggle highlight"
            tooltipTitle={`${t("wordHighlight")} (H)`}
            tooltipDesc={showHighlight ? t("hideHighlight") : t("showHighlight")}
            style={{ background: showHighlight ? "#0f0f0f" : "#0f0f0f" }}
          >
            {showHighlight ? (
              // eye icon
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              // eye-off icon
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.29 20.29 0 0 1 5.11-5.11" />
                <path d="M22.11 12.89S20 9 17 7.05" />
                <path d="M9.9 9.9a3 3 0 1 0 4.24 4.24" />
                <path d="M1 1l22 22" />
              </svg>
            )}
          </IconButton>

          <IconButton uiOpacity={uiOpacity}
            onClick={resetPosition}
            ariaLabel="Reset"
            tooltipTitle={`${t("reset")} (R)`}
            tooltipDesc={t("resetTip")}
            style={{ background: "#0f0f0f" }}
          >
            <Icon name={"arrow-path"} />
          </IconButton>

          <IconButton uiOpacity={uiOpacity}
            onClick={() => setShowEditor(!showEditor)}
            ariaLabel="Script Editor"
            tooltipTitle={`${t("scriptEditor")} (S)`}
            tooltipDesc={t("scriptEditorTip")}
            style={{ background: "#0f0f0f" }}
          >
            <Icon name={"pencil-square"} />
          </IconButton>

          <IconButton uiOpacity={uiOpacity}
            onClick={() => setShowSettings(!showSettings)}
            ariaLabel="Settings"
            tooltipTitle={`${t("settings")} (E)`}
            tooltipDesc={t("settingsTip")}
            style={{ background: "#0f0f0f" }}
          >
            <Icon name={"adjustments-horizontal"} />
          </IconButton>

          <IconButton uiOpacity={uiOpacity}
            onClick={toggleFullscreen}
            ariaLabel="Fullscreen"
            tooltipTitle={`${t("fullscreen")} (F)`}
            tooltipDesc={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
            style={{ background: "#0f0f0f" }}
          >
            <Icon
              name={isFullscreen ? "arrows-pointing-in" : "arrows-pointing-out"}
            />
          </IconButton>

          <IconButton uiOpacity={uiOpacity}
            onClick={() => setShowShortcuts((v) => !v)}
            ariaLabel="Keyboard Shortcuts"
            tooltipTitle={`${t("keyboardShortcuts")} (?)`}
            tooltipDesc={t("keyboardShortcutsTip")}
            style={{ background: showShortcuts ? "#1565c0" : "#0f0f0f" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <path d="M6 8h.001" />
              <path d="M10 8h.001" />
              <path d="M14 8h.001" />
              <path d="M18 8h.001" />
              <path d="M6 12h.001" />
              <path d="M18 12h.001" />
              <path d="M8 16h8" />
            </svg>
          </IconButton>

          {showSupportPrompts && (
            <IconButton uiOpacity={uiOpacity}
              onClick={() =>
                window.open("https://buymeacoffee.com/nrjsoeq61", "_blank")
              }
              ariaLabel="Buy Me a Coffee"
              tooltipTitle={t("buyMeCoffee")}
              tooltipDesc={t("supportBody")}
              style={{ background: "#0f0f0f" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </IconButton>
          )}

          <IconButton uiOpacity={uiOpacity}
            onClick={() => (window.location.href = "./index.html")}
            ariaLabel="Back to Homepage"
            tooltipTitle={t("backHome")}
            tooltipDesc={t("backHomeTip")}
            style={{ background: "#0f0f0f" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Settings Panel */}
      {(showSettings || showEditor) && (
        <div
          data-panel="settings"
          style={{
            position: "fixed",
            top: "80px",
            right: "16px",
            background: "rgba(0,0,0,0.95)",
            padding: "25px",
            borderRadius: "12px",
            zIndex: 10000,
            minWidth: "320px",
            maxWidth: showEditor ? "500px" : "calc(95vw - 40px)",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            border: "2px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 style={{ color: "white", margin: 0 }}>
              {showEditor ? t("scriptEditor") : t("settings")}
            </h2>
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setShowSettings(false);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #555",
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {t("close")}
              </button>
            </div>
          </div>
          {showEditor ? (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{
                  width: "94%",
                  minHeight: showScriptList ? "25vh" : "50vh",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #555",
                  background: "#222",
                  color: "white",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  transition: "min-height 0.2s ease",
                }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    background: "#1565c0",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {t("import")}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(text);
                    alert(t("copied"));
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    background: "#2e7d32",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  📋 {t("copy")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("clearConfirm"))) {
                      setText("");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    background: "#d32f2f",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  🗑️ {t("clear")}
                </button>
              </div>

              {/* My Scripts section */}
              <ScriptList
                t={t}
                languagesList={languagesList}
                showScriptList={showScriptList}
                setShowScriptList={setShowScriptList}
                savedScripts={savedScripts}
                MAX_SCRIPTS={MAX_SCRIPTS}
                openAddScriptModal={openAddScriptModal}
                openEditScriptModal={openEditScriptModal}
                loadScript={loadScript}
                setDeleteScriptConfirm={setDeleteScriptConfirm}
              />
              <div style={{ height: 8 }} />
            </div>
          ) : (
            <SettingsPanel
              t={t}
              setShowResetConfirm={setShowResetConfirm}
              uiLanguage={uiLanguage}
              setUiLanguage={setUiLanguage}
              fontSize={fontSize}
              setFontSize={setFontSize}
              sidePaddingVw={sidePaddingVw}
              setSidePaddingVw={setSidePaddingVw}
              textAlignStyle={textAlignStyle}
              setTextAlignStyle={setTextAlignStyle}
              lineHeight={lineHeight}
              setLineHeight={setLineHeight}
              paragraphSpacingPx={paragraphSpacingPx}
              setParagraphSpacingPx={setParagraphSpacingPx}
              scrollSpeed={scrollSpeed}
              setScrollSpeed={setScrollSpeed}
              lookaheadWindow={lookaheadWindow}
              setLookaheadWindow={setLookaheadWindow}
              paragraphLookahead={paragraphLookahead}
              setParagraphLookahead={setParagraphLookahead}
              skipCoHostLines={skipCoHostLines}
              setSkipCoHostLines={setSkipCoHostLines}
              textOpacity={textOpacity}
              setTextOpacity={setTextOpacity}
              aimOpacity={aimOpacity}
              setAimOpacity={setAimOpacity}
              paragraphHighlightOpacity={paragraphHighlightOpacity}
              setParagraphHighlightOpacity={setParagraphHighlightOpacity}
              uiOpacity={uiOpacity}
              setUiOpacity={setUiOpacity}
              toolbarPosition={toolbarPosition}
              setToolbarPosition={setToolbarPosition}
              showAim={showAim}
              setShowAim={setShowAim}
              aimStyle={aimStyle}
              setAimStyle={setAimStyle}
              aimColor={aimColor}
              setAimColor={setAimColor}
              aimOffsetX={aimOffsetX}
              setAimOffsetX={setAimOffsetX}
              aimOffsetY={aimOffsetY}
              setAimOffsetY={setAimOffsetY}
              showListeningIndicator={showListeningIndicator}
              setShowListeningIndicator={setShowListeningIndicator}
              showSupportPrompts={showSupportPrompts}
              setShowSupportPrompts={setShowSupportPrompts}
              setShowSupportMessage={setShowSupportMessage}
              centerPaddingVh={centerPaddingVh}
              setCenterPaddingVh={setCenterPaddingVh}
              setShowCenterLine={setShowCenterLine}
              bgColor={bgColor}
              setBgColor={setBgColor}
              textColor={textColor}
              setTextColor={setTextColor}
              highlightColor={highlightColor}
              setHighlightColor={setHighlightColor}
            />
          )}
        </div>
      )}

      {/* Teleprompter Text */}
      <div
        ref={textContainerRef}
        tabIndex={0}
        style={{
          paddingTop: `${centerPaddingVh}vh`,
          // Ensure end-of-text can reach the center: large safety buffer
          paddingBottom: `calc(max(35vh, ${100 - centerPaddingVh}vh) + 120vh)`,
          paddingLeft: `${sidePaddingVw}vw`,
          paddingRight: `${sidePaddingVw}vw`,
          height: "calc(100vh - 70px)",
          overflowY: "auto",
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          color: textColor,
          opacity: textOpacity,
          textAlign: textAlignStyle,
          // avoid CSS smooth scroll; we manage smoothness via JS
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          whiteSpace: "pre-wrap",
        }}
        aria-label="Editor"
      >
        {showAim && (
          <div
            style={{
              position: "fixed",
              top: `calc(50% + ${aimOffsetY}px)`,
              left: `calc(50% + ${aimOffsetX}px)`,
              transform: "translate(-50%, -50%)",
              zIndex: 1200,
              pointerEvents: "none",
              opacity: 0.8,
            }}
            aria-hidden="true"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={aimColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: aimOpacity }}
            >
              {aimStyle === "dot" ? (
                <circle cx="12" cy="12" r="4" fill={aimColor} stroke="none" />
              ) : aimStyle === "frame" ? (
                <>
                  <path d="M3 8V3h5" />
                  <path d="M16 3h5v5" />
                  <path d="M21 16v5h-5" />
                  <path d="M8 21H3v-5" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 1v4" />
                  <path d="M12 19v4" />
                  <path d="M1 12h4" />
                  <path d="M19 12h4" />
                </>
              )}
            </svg>
          </div>
        )}
        <div
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            textAlign: textAlignStyle,
            transform: `${mirrorX ? "scaleX(-1)" : "scaleX(1)"} `,
          }}
        >
          {linesWords.map((lineWordsLocal, lineIdx) => {
            const lineStart = lineStartIndex[lineIdx] || 0;
            const lineEnd = lineStart + lineWordsLocal.length - 1;
            const activeIndex =
              currentWordIndex >= lineStart && currentWordIndex <= lineEnd
                ? currentWordIndex
                : -1;
            return (
              <TeleprompterLine
                key={lineIdx}
                words={lineWordsLocal}
                lineIdx={lineIdx}
                lineStart={lineStart}
                activeIndex={activeIndex}
                isCoHost={!!(skipCoHostLines && lineIsCoHost[lineIdx])}
                lineStyle={lineStyles[lineIdx]}
                showHighlight={showHighlight}
                highlightColor={highlightColor}
                textColor={textColor}
                paragraphSpacingPx={paragraphSpacingPx}
                paragraphHighlightOpacity={paragraphHighlightOpacity}
                onWordClick={setCurrentWordIndex}
              />
            );
          })}
          {/* dynamic spacer to guarantee room to center near the end */}
          <div style={{ height: `${extraBottomSpacePx}px` }} />
        </div>
      </div>

      {/* iOS Warning */}
      {isIOS && !iosBannerDismissed && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(33, 33, 33, 0.95)",
            color: "white",
            padding: "15px 20px",
            borderRadius: "8px",
            maxWidth: "90%",
            textAlign: "center",
            zIndex: 2000,
            border: "2px solid #555",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            {t("iosLimitation")}
          </div>
          <div style={{ fontSize: "14px", lineHeight: 1.5 }}>
            {t("iosSpeechUnavailable")}
            <br />
            {t("iosAutoPlayOnly")}
          </div>
          <button
            onClick={() => setIosBannerDismissed(true)}
            style={{
              marginTop: "10px",
              padding: "6px 16px",
              borderRadius: "6px",
              border: "1px solid #555",
              background: "#37474f",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {t("iosBannerDismiss")}
          </button>
        </div>
      )}

      {/* Status Indicator (hideable in settings — can distract on camera) */}
      {showListeningIndicator && (isListening || micStatus) && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: isListening
              ? "rgba(244, 67, 54, 0.9)"
              : "rgba(38, 50, 56, 0.92)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "bold",
            animation: isListening ? "pulse 1.5s infinite" : "none",
            maxWidth: "min(90vw, 620px)",
            minWidth: "min(90vw, 360px)",
            minHeight: "52px",
            textAlign: "left",
          }}
        >
          <span aria-hidden="true">🎙️</span>
          <span>
            <span>{isListening ? t("listening") : t("microphoneStatus")}</span>
            {micStatus && (
              <span
                role="status"
                style={{
                  display: "block",
                  marginTop: "3px",
                  fontSize: "12px",
                  fontWeight: "normal",
                  lineHeight: 1.35,
                  opacity: 0.95,
                }}
              >
                {micStatus}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Support Message */}
      {showSupportPrompts && showSupportMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "12px",
            maxWidth: "calc(100vw - 40px)",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.1)",
            opacity: 0.7,
          }}
        >
          <button
            onClick={() => setShowSupportMessage(false)}
            style={{
              position: "absolute",
              top: "4px",
              right: "6px",
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              padding: "2px",
              borderRadius: "2px",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close support message"
          >
            ×
          </button>
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
            {t("supportTitle")}
          </div>
          <div style={{ marginBottom: "8px" }}>
            {t("supportBody")} ☕
          </div>
          <button
            onClick={() =>
              window.open("https://buymeacoffee.com/nrjsoeq61", "_blank")
            }
            style={{
              background: "#D1AA17",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "bold",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {t("buyMeCoffee")}
          </button>
        </div>
      )}

      {/* Delete Script Confirmation Modal */}
      {deleteScriptConfirm && (
        <DeleteScriptConfirmModal
          t={t}
          script={deleteScriptConfirm}
          onCancel={() => setDeleteScriptConfirm(null)}
          onConfirm={confirmDeleteScript}
        />
      )}

      {/* Import Shared Script Confirmation Modal */}
      {pendingSharedScript && (
        <SharedScriptImportModal
          t={t}
          script={pendingSharedScript}
          onCancel={() => setPendingSharedScript(null)}
          onConfirm={confirmImportSharedScript}
        />
      )}

      {/* Add / Edit Script Modal */}
      {showAddScript && (
        <AddEditScriptModal
          t={t}
          languagesList={languagesList}
          editScriptId={editScriptId}
          addScriptName={addScriptName}
          setAddScriptName={setAddScriptName}
          addScriptLanguage={addScriptLanguage}
          setAddScriptLanguage={setAddScriptLanguage}
          addScriptText={addScriptText}
          setAddScriptText={setAddScriptText}
          scriptFormTouched={scriptFormTouched}
          onClose={() => setShowAddScript(false)}
          onSave={() => saveScript(false)}
          onSaveAndLoad={() => saveScript(true)}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ResetConfirmModal
          t={t}
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={() => {
            resetSettingsToDefault();
            setShowResetConfirm(false);
          }}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <ShortcutsHelpModal
          t={t}
          appVersion={__APP_VERSION__}
          onClose={() => setShowShortcuts(false)}
        />
      )}

    </main>
  );
}
