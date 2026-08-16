import { useEffect } from "react";

// Global keydown handler for all teleprompter keyboard shortcuts
// (V/P/H/R/L/S/B/E/F/M/?/Escape). Skips input/textarea targets and
// IME composition so typing in the editor or script forms isn't hijacked.
export default function useKeyboardShortcuts({
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
}) {
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
}
