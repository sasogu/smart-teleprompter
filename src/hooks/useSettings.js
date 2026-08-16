import { useEffect, useState } from "react";
import { SUPPORT_PROMPTS_KEY, UI_LANGUAGE_KEY } from "../constants/keys.js";

const SETTINGS_KEY = "tp_settings_v1";

// The persisted visual/behavioral settings (font, colors, aim marker,
// scroll speed, etc.) plus the script text and its format are bundled
// together in a single localStorage blob under SETTINGS_KEY. `text`/
// `setText`/`textFormat`/`setTextFormat` are owned by the caller (the main
// teleprompter script state, used far beyond settings) — this hook only
// reads/writes them as part of that shared load/save cycle.
export default function useSettings({ text, setText, textFormat, setTextFormat }) {
  const [fontSize, setFontSize] = useState(32);
  const [margin, setMargin] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [scrollSpeed, setScrollSpeed] = useState(88);
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");
  const [followEnabled, setFollowEnabled] = useState(false);
  const [lookaheadWindow, setLookaheadWindow] = useState(10);
  const [paragraphLookahead, setParagraphLookahead] = useState(3);
  const [centerPaddingVh, setCenterPaddingVh] = useState(45);
  const [showAim, setShowAim] = useState(true);
  const [aimOffsetX, setAimOffsetX] = useState(0);
  const [aimOffsetY, setAimOffsetY] = useState(0);
  // Aim marker style/color + hideable "Listening" pill — added after user
  // feedback (Reddit r/elgato): the red pill can distract during recording,
  // and users asked for marker variants (e.g. Elgato-style frame, blue color).
  const [aimStyle, setAimStyle] = useState("crosshair"); // crosshair | dot | frame
  const [aimColor, setAimColor] = useState("#ffeb3b");
  const [showListeningIndicator, setShowListeningIndicator] = useState(true);
  // Co-host lines (">>" / "@Name:") — dim them and let voice tracking skip them
  const [skipCoHostLines, setSkipCoHostLines] = useState(true);
  const [textOpacity, setTextOpacity] = useState(0.8);
  const [aimOpacity, setAimOpacity] = useState(1);
  const [uiOpacity, setUiOpacity] = useState(0.9);
  const [paragraphSpacingPx, setParagraphSpacingPx] = useState(12);
  const [sidePaddingVw, setSidePaddingVw] = useState(10);
  const [textAlignStyle, setTextAlignStyle] = useState("left");
  const [mirrorX, setMirrorX] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState("top"); // top | bottom
  const [language, setLanguage] = useState("en-US");
  const [showSupportPrompts, setShowSupportPrompts] = useState(() => {
    try {
      return localStorage.getItem(SUPPORT_PROMPTS_KEY) !== "false";
    } catch (_) {
      return true;
    }
  });
  const [uiLanguage, setUiLanguage] = useState(() => {
    try {
      return localStorage.getItem(UI_LANGUAGE_KEY) === "es" ? "es" : "en";
    } catch (_) {
      return "en";
    }
  });
  const [paragraphHighlightOpacity, setParagraphHighlightOpacity] =
    useState(0.12);

  const defaultSettings = {
    fontSize: 32,
    margin: 20,
    lineHeight: 1.5,
    scrollSpeed: 94,
    bgColor: "#000000",
    textColor: "#ffffff",
    highlightColor: "#ffeb3b",
    followEnabled: false,
    lookaheadWindow: 10,
    paragraphLookahead: 3,
    centerPaddingVh: 45,
    showAim: true,
    aimOffsetX: 0,
    aimOffsetY: 0,
    aimStyle: "crosshair",
    aimColor: "#ffeb3b",
    showListeningIndicator: true,
    skipCoHostLines: true,
    textOpacity: 0.8,
    aimOpacity: 1,
    uiOpacity: 0.9,
    paragraphSpacingPx: 4,
    sidePaddingVw: 20,
    textAlignStyle: "left",
    paragraphHighlightOpacity: 0.2,
    language: "en-US",
    mirrorX: false,
    toolbarPosition: "top",
    showSupportPrompts: true,
    uiLanguage: "en",
  };

  const resetSettingsToDefault = () => {
    setFontSize(defaultSettings.fontSize);
    setMargin(defaultSettings.margin);
    setLineHeight(defaultSettings.lineHeight);
    setScrollSpeed(defaultSettings.scrollSpeed);
    setBgColor(defaultSettings.bgColor);
    setTextColor(defaultSettings.textColor);
    setHighlightColor(defaultSettings.highlightColor);
    setFollowEnabled(defaultSettings.followEnabled);
    setLookaheadWindow(defaultSettings.lookaheadWindow);
    setParagraphLookahead(defaultSettings.paragraphLookahead);
    setCenterPaddingVh(defaultSettings.centerPaddingVh);
    setShowAim(defaultSettings.showAim);
    setAimOffsetX(defaultSettings.aimOffsetX);
    setAimOffsetY(defaultSettings.aimOffsetY);
    setAimStyle(defaultSettings.aimStyle);
    setAimColor(defaultSettings.aimColor);
    setShowListeningIndicator(defaultSettings.showListeningIndicator);
    setSkipCoHostLines(defaultSettings.skipCoHostLines);
    setTextOpacity(defaultSettings.textOpacity);
    setAimOpacity(defaultSettings.aimOpacity);
    setUiOpacity(defaultSettings.uiOpacity);
    setParagraphSpacingPx(defaultSettings.paragraphSpacingPx);
    setSidePaddingVw(defaultSettings.sidePaddingVw);
    setTextAlignStyle(defaultSettings.textAlignStyle);
    setParagraphHighlightOpacity(defaultSettings.paragraphHighlightOpacity);
    setLanguage(defaultSettings.language);
    setMirrorX(defaultSettings.mirrorX);
    setToolbarPosition(defaultSettings.toolbarPosition);
    setShowSupportPrompts(defaultSettings.showSupportPrompts);
    setUiLanguage(defaultSettings.uiLanguage);
    try {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(SUPPORT_PROMPTS_KEY);
      localStorage.removeItem(UI_LANGUAGE_KEY);
    } catch (_) {}
  };

  // Load settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.fontSize != null) setFontSize(s.fontSize);
      if (s.margin != null) setMargin(s.margin);
      if (s.lineHeight != null) setLineHeight(s.lineHeight);
      if (s.scrollSpeed != null) setScrollSpeed(s.scrollSpeed);
      if (s.bgColor) setBgColor(s.bgColor);
      if (s.textColor) setTextColor(s.textColor);
      if (s.highlightColor) setHighlightColor(s.highlightColor);
      if (typeof s.text === "string") setText(s.text);
      if (s.followEnabled != null) setFollowEnabled(s.followEnabled);
      if (s.lookaheadWindow != null) setLookaheadWindow(s.lookaheadWindow);
      if (s.paragraphLookahead != null)
        setParagraphLookahead(s.paragraphLookahead);
      if (s.centerPaddingVh != null) setCenterPaddingVh(s.centerPaddingVh);
      if (s.showAim != null) setShowAim(s.showAim);
      if (s.aimOffsetX != null) setAimOffsetX(s.aimOffsetX);
      if (s.aimOffsetY != null) setAimOffsetY(s.aimOffsetY);
      if (s.aimStyle) setAimStyle(s.aimStyle);
      if (s.aimColor) setAimColor(s.aimColor);
      if (s.showListeningIndicator != null)
        setShowListeningIndicator(s.showListeningIndicator);
      if (s.skipCoHostLines != null) setSkipCoHostLines(s.skipCoHostLines);
      if (s.textOpacity != null) setTextOpacity(s.textOpacity);
      if (s.aimOpacity != null) setAimOpacity(s.aimOpacity);
      if (s.uiOpacity != null) setUiOpacity(s.uiOpacity);
      if (s.paragraphSpacingPx != null)
        setParagraphSpacingPx(s.paragraphSpacingPx);
      if (s.sidePaddingVw != null) setSidePaddingVw(s.sidePaddingVw);
      if (s.textAlignStyle) setTextAlignStyle(s.textAlignStyle);
      if (s.paragraphHighlightOpacity != null)
        setParagraphHighlightOpacity(s.paragraphHighlightOpacity);
      if (s.language) setLanguage(s.language);
      if (s.mirrorX != null) setMirrorX(!!s.mirrorX);
      if (s.toolbarPosition === "top" || s.toolbarPosition === "bottom")
        setToolbarPosition(s.toolbarPosition);
      if (s.showSupportPrompts != null)
        setShowSupportPrompts(!!s.showSupportPrompts);
      if (s.uiLanguage === "es" || s.uiLanguage === "en")
        setUiLanguage(s.uiLanguage);
      if (s.textFormat === "markdown" || s.textFormat === "plain")
        setTextFormat(s.textFormat);
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings on change.
  // Debounced (400ms): previously this serialized ALL settings PLUS the whole
  // script text to localStorage on every keystroke — noticeable jank with
  // long scripts. Also fixed: `language` and `mirrorX` were missing from the
  // dependency array, so changing them alone was never persisted.
  useEffect(() => {
    const timer = setTimeout(() => {
      const s = {
        fontSize,
        margin,
        lineHeight,
        scrollSpeed,
        bgColor,
        textColor,
        highlightColor,
        followEnabled,
        lookaheadWindow,
        paragraphLookahead,
        centerPaddingVh,
        showAim,
        aimOffsetX,
        aimOffsetY,
        aimStyle,
        aimColor,
        showListeningIndicator,
        skipCoHostLines,
        textOpacity,
        aimOpacity,
        uiOpacity,
        paragraphSpacingPx,
        sidePaddingVw,
        textAlignStyle,
        paragraphHighlightOpacity,
        language,
        mirrorX,
        toolbarPosition,
        textFormat,
        showSupportPrompts,
        uiLanguage,

        text,
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
        localStorage.setItem(
          SUPPORT_PROMPTS_KEY,
          showSupportPrompts ? "true" : "false"
        );
        localStorage.setItem(UI_LANGUAGE_KEY, uiLanguage);
      } catch (_) {}
    }, 400);
    return () => clearTimeout(timer);
  }, [
    fontSize,
    margin,
    lineHeight,
    scrollSpeed,
    bgColor,
    textColor,
    highlightColor,
    followEnabled,
    lookaheadWindow,
    paragraphLookahead,
    centerPaddingVh,
    showAim,
    aimOffsetX,
    aimOffsetY,
    aimStyle,
    aimColor,
    showListeningIndicator,
    skipCoHostLines,
    textOpacity,
    aimOpacity,
    uiOpacity,
    paragraphSpacingPx,
    sidePaddingVw,
    textAlignStyle,
    paragraphHighlightOpacity,
    language,
    mirrorX,
    toolbarPosition,
    textFormat,
    showSupportPrompts,
    uiLanguage,
    text,
  ]);

  return {
    fontSize,
    setFontSize,
    margin,
    setMargin,
    lineHeight,
    setLineHeight,
    scrollSpeed,
    setScrollSpeed,
    bgColor,
    setBgColor,
    textColor,
    setTextColor,
    highlightColor,
    setHighlightColor,
    followEnabled,
    setFollowEnabled,
    lookaheadWindow,
    setLookaheadWindow,
    paragraphLookahead,
    setParagraphLookahead,
    centerPaddingVh,
    setCenterPaddingVh,
    showAim,
    setShowAim,
    aimOffsetX,
    setAimOffsetX,
    aimOffsetY,
    setAimOffsetY,
    aimStyle,
    setAimStyle,
    aimColor,
    setAimColor,
    showListeningIndicator,
    setShowListeningIndicator,
    skipCoHostLines,
    setSkipCoHostLines,
    textOpacity,
    setTextOpacity,
    aimOpacity,
    setAimOpacity,
    uiOpacity,
    setUiOpacity,
    paragraphSpacingPx,
    setParagraphSpacingPx,
    sidePaddingVw,
    setSidePaddingVw,
    textAlignStyle,
    setTextAlignStyle,
    mirrorX,
    setMirrorX,
    toolbarPosition,
    setToolbarPosition,
    language,
    setLanguage,
    showSupportPrompts,
    setShowSupportPrompts,
    uiLanguage,
    setUiLanguage,
    paragraphHighlightOpacity,
    setParagraphHighlightOpacity,
    defaultSettings,
    resetSettingsToDefault,
  };
}
