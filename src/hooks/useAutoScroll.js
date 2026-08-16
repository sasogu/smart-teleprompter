import { useEffect } from "react";
import { computeAutoIntervalMs } from "../utils/autoScroll.js";

// Scroll/centering math + time-based auto-advance ("P" mode) + the
// recenter watchdog. The watchdog effect also carries the microphone
// silence watchdog: both share a single requestAnimationFrame tick in
// the original code, so they stay fused here rather than split across
// hooks — splitting would double the rAF loop and change timing.
export default function useAutoScroll({
  textContainerRef,
  programmaticScrollRef,
  scrollAnimTokenRef,
  autoRafIdRef,
  autoLastTsRef,
  lastScrollTopRef,
  stagnantStepsRef,
  prevLineIdxRef,
  prevVisualLineIdxRef,
  currentWordIndexRef,
  wordsRef,
  autoScrollInterval,
  centerPaddingVh,
  fontSize,
  lineHeight,
  scrollSpeed,
  setExtraBottomSpacePx,
  isPlaying,
  setIsPlaying,
  isListening,
  setIsListening,
  currentWordIndex,
  setCurrentWordIndex,
  followEnabled,
  getLineIdxForWord,
  isListeningRef,
  recognizingRef,
  recognitionRef,
  safeRestartRecognition,
}) {
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

  // Time-based auto-advance ("P" mode): independent of the microphone,
  // driven purely by scrollSpeed.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isListening, scrollSpeed]);

  // Re-center whenever the current word's logical or visual line changes.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentWordIndex,
    followEnabled,
    isListening,
    isPlaying,
    fontSize,
    lineHeight,
    centerPaddingVh,
  ]);

  // Watchdog: if active and the anchor drifts far from the current word,
  // force re-center. Shares its rAF tick with the microphone silence
  // watchdog (stop/restart recognition if no result for a while).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, isPlaying, fontSize, lineHeight, centerPaddingVh]);

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

  return {
    centerOnWordIndex,
    centerOnLineStart,
    getTargetTopForLine,
    smoothScrollTo,
    centerOnLineStartSmooth,
    getTargetTopForWord,
    centerOnWordSmooth,
    getVisualLineIdxForWord,
    getWordAnchorDelta,
    resetPosition,
  };
}
