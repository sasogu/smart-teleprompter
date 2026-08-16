import { useState, useEffect, useLayoutEffect, useRef } from "react";
import CustomSlider from "./components/CustomSlider.jsx";
import { Icon } from "./constants/icons.jsx";
import { SUPPORT_PROMPTS_KEY, UI_LANGUAGE_KEY } from "./constants/keys.js";
import { UI_TEXT } from "./i18n/translations.js";
import { cleanMarkdownInline, markdownToTeleprompterLines, getLinePresentationStyle } from "./utils/markdown.js";
import { normalizeWord } from "./utils/matching.js";
import { computeAutoIntervalMs } from "./utils/autoScroll.js";
import IconButton from "./components/IconButton.jsx";
import ResetConfirmModal from "./components/modals/ResetConfirmModal.jsx";
import ShortcutsHelpModal from "./components/modals/ShortcutsHelpModal.jsx";
import ScriptList from "./components/ScriptList.jsx";
import DeleteScriptConfirmModal from "./components/modals/DeleteScriptConfirmModal.jsx";
import SharedScriptImportModal from "./components/modals/SharedScriptImportModal.jsx";
import AddEditScriptModal from "./components/modals/AddEditScriptModal.jsx";
import Toolbar from "./components/Toolbar.jsx";
import TeleprompterDisplay from "./components/TeleprompterDisplay.jsx";
import useScriptLibrary from "./hooks/useScriptLibrary.js";
import useSettings from "./hooks/useSettings.js";
import useWebMCP from "./hooks/useWebMCP.js";
import useAutoScroll from "./hooks/useAutoScroll.js";
import useSpeechRecognition from "./hooks/useSpeechRecognition.js";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts.js";
import SettingsPanel from "./components/SettingsPanel.jsx";


// Co-host speaker markers (GitHub #2): a line starting with ">>" or "@Name:"
// belongs to another speaker. It renders dimmed and voice tracking skips it,
// so shared scripts auto-jump to the presenter's next line no matter how long
// the co-host's part is.
const CO_HOST_LINE_RE = /^\s*(>>|@[^\s:]{1,30}:)/;

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
    setEditScriptId,
    addScriptName,
    setAddScriptName,
    addScriptText,
    setAddScriptText,
    addScriptLanguage,
    setAddScriptLanguage,
    scriptFormTouched,
    setScriptFormTouched,
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

  const fileInputRef = useRef(null);
  const wordsRef = useRef([]);
  const normalizedWordsRef = useRef([]);
  const linesRawRef = useRef([]);
  const linesWordsRef = useRef([]);
  const lineStartIndexRef = useRef([]);
  const toolbarScrollRef = useRef(null);
  // Co-host markers: per-line + per-word skip flags (refs so the
  // speech-recognition closures always see fresh values)
  const lineIsCoHostRef = useRef([]);
  const skippableWordsRef = useRef([]);
  const currentWordIndexRef = useRef(-1);
  const textContainerRef = useRef(null);
  const autoScrollInterval = useRef(null);
  const autoRafIdRef = useRef(null);
  const autoLastTsRef = useRef(0);
  const scrollAnimTokenRef = useRef(0);
  const userInteractTimeoutRef = useRef(null);
  const hasInitialCenterRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const prevLineIdxRef = useRef(-1);
  const prevVisualLineIdxRef = useRef(-1);
  const lastScrollTopRef = useRef(0);
  const stagnantStepsRef = useRef(0);
  // Populated after useAutoScroll below; lets toggleListening (inside
  // useSpeechRecognition, called before useAutoScroll exists) reach the
  // latest centerOnWordSmooth without a circular hook-call order.
  const centerOnWordSmoothRef = useRef(() => {});

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

  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  const {
    toggleListening,
    recognitionRef,
    isListeningRef,
    recognizingRef,
    safeRestartRecognition,
    getLineIdxForWord,
  } = useSpeechRecognition({
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
  });

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

  // Recompute language menu position when opened
  useEffect(() => {
    if (showLanguageSelector && languageBtnRef.current) {
      const rect = languageBtnRef.current.getBoundingClientRect();
      setLanguageMenuPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, [showLanguageSelector]);

  const {
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
  } = useAutoScroll({
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
  });

  // Global keyboard shortcuts (after handlers are defined)
  useKeyboardShortcuts({
    toggleListening,
    toggleAutoPlay,
    setShowHighlight,
    resetPosition,
    setShowLanguageSelector,
    languageBtnRef,
    setLanguageMenuPos,
    setShowEditor,
    setShowScriptList,
    setShowSettings,
    toggleFullscreen,
    setMirrorX,
    setShowShortcuts,
    pendingSharedScript,
    setPendingSharedScript,
    deleteScriptConfirm,
    setDeleteScriptConfirm,
    showAddScript,
    setShowAddScript,
    showShortcuts,
    showResetConfirm,
    setShowResetConfirm,
    showEditor,
    showSettings,
    isListening,
    isPlaying,
    showHighlight,
  });

  useEffect(() => {
    centerOnWordSmoothRef.current = centerOnWordSmooth;
  });

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
      <Toolbar
        t={t}
        toolbarPosition={toolbarPosition}
        uiOpacity={uiOpacity}
        toolbarHints={toolbarHints}
        scrollToolbar={scrollToolbar}
        toolbarScrollRef={toolbarScrollRef}
        updateToolbarHints={updateToolbarHints}
        isListening={isListening}
        toggleListening={toggleListening}
        language={language}
        setLanguage={setLanguage}
        languageBtnRef={languageBtnRef}
        showLanguageSelector={showLanguageSelector}
        setShowLanguageSelector={setShowLanguageSelector}
        languageMenuPos={languageMenuPos}
        setLanguageMenuPos={setLanguageMenuPos}
        languagesList={languagesList}
        recognitionRef={recognitionRef}
        isListeningRef={isListeningRef}
        safeRestartRecognition={safeRestartRecognition}
        mirrorX={mirrorX}
        setMirrorX={setMirrorX}
        isPlaying={isPlaying}
        toggleAutoPlay={toggleAutoPlay}
        showHighlight={showHighlight}
        setShowHighlight={setShowHighlight}
        resetPosition={resetPosition}
        showEditor={showEditor}
        setShowEditor={setShowEditor}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
        showSupportPrompts={showSupportPrompts}
      />

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
      <TeleprompterDisplay
        textContainerRef={textContainerRef}
        centerPaddingVh={centerPaddingVh}
        sidePaddingVw={sidePaddingVw}
        fontSize={fontSize}
        lineHeight={lineHeight}
        textColor={textColor}
        textOpacity={textOpacity}
        textAlignStyle={textAlignStyle}
        showAim={showAim}
        aimOffsetX={aimOffsetX}
        aimOffsetY={aimOffsetY}
        aimColor={aimColor}
        aimOpacity={aimOpacity}
        aimStyle={aimStyle}
        mirrorX={mirrorX}
        linesWords={linesWords}
        lineStartIndex={lineStartIndex}
        currentWordIndex={currentWordIndex}
        skipCoHostLines={skipCoHostLines}
        lineIsCoHost={lineIsCoHost}
        lineStyles={lineStyles}
        showHighlight={showHighlight}
        highlightColor={highlightColor}
        paragraphSpacingPx={paragraphSpacingPx}
        paragraphHighlightOpacity={paragraphHighlightOpacity}
        setCurrentWordIndex={setCurrentWordIndex}
        extraBottomSpacePx={extraBottomSpacePx}
      />

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
