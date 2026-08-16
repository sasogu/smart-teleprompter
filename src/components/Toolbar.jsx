import IconButton from "./IconButton.jsx";
import LanguageDropdown from "./LanguageDropdown.jsx";
import { Icon } from "../constants/icons.jsx";

export default function Toolbar({
  t,
  toolbarPosition,
  uiOpacity,
  toolbarHints,
  scrollToolbar,
  toolbarScrollRef,
  updateToolbarHints,
  isListening,
  toggleListening,
  language,
  setLanguage,
  languageBtnRef,
  showLanguageSelector,
  setShowLanguageSelector,
  languageMenuPos,
  setLanguageMenuPos,
  languagesList,
  recognitionRef,
  isListeningRef,
  safeRestartRecognition,
  mirrorX,
  setMirrorX,
  isPlaying,
  toggleAutoPlay,
  showHighlight,
  setShowHighlight,
  resetPosition,
  showEditor,
  setShowEditor,
  showSettings,
  setShowSettings,
  isFullscreen,
  toggleFullscreen,
  showShortcuts,
  setShowShortcuts,
  showSupportPrompts,
}) {
  return (
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

        {/* Editor button will be placed right before Settings */}

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
  );
}
