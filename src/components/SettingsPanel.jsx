import CustomSlider from "./CustomSlider.jsx";

export default function SettingsPanel({
  t,
  setShowResetConfirm,
  uiLanguage,
  setUiLanguage,
  fontSize,
  setFontSize,
  sidePaddingVw,
  setSidePaddingVw,
  textAlignStyle,
  setTextAlignStyle,
  lineHeight,
  setLineHeight,
  paragraphSpacingPx,
  setParagraphSpacingPx,
  scrollSpeed,
  setScrollSpeed,
  lookaheadWindow,
  setLookaheadWindow,
  paragraphLookahead,
  setParagraphLookahead,
  skipCoHostLines,
  setSkipCoHostLines,
  textOpacity,
  setTextOpacity,
  aimOpacity,
  setAimOpacity,
  paragraphHighlightOpacity,
  setParagraphHighlightOpacity,
  uiOpacity,
  setUiOpacity,
  toolbarPosition,
  setToolbarPosition,
  showAim,
  setShowAim,
  aimStyle,
  setAimStyle,
  aimColor,
  setAimColor,
  aimOffsetX,
  setAimOffsetX,
  aimOffsetY,
  setAimOffsetY,
  showListeningIndicator,
  setShowListeningIndicator,
  showSupportPrompts,
  setShowSupportPrompts,
  setShowSupportMessage,
  centerPaddingVh,
  setCenterPaddingVh,
  setShowCenterLine,
  bgColor,
  setBgColor,
  textColor,
  setTextColor,
  highlightColor,
  setHighlightColor,
}) {
  return (
    <>
      <button
        onClick={() => setShowResetConfirm(true)}
        style={{
          width: "100%",
          marginBottom: "12px",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #555",
          background: "#b71c1c",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {t("resetSettings")}
      </button>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("uiLanguage")}
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            ["en", t("english")],
            ["es", t("spanish")],
          ].map(([code, label]) => (
            <button
              key={code}
              onClick={() => setUiLanguage(code)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #555",
                background: uiLanguage === code ? "#2e7d32" : "#0f0f0f",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("fontSize")}: {fontSize}px
        </label>
        <CustomSlider min={16} max={80} value={fontSize} onChange={setFontSize} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("sidePadding")}: {sidePaddingVw}vw
        </label>
        <CustomSlider
          min={0}
          max={40}
          value={sidePaddingVw}
          onChange={setSidePaddingVw}
        />
      </div>

      {/* Text align controls removed per request */}

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("textAlign")}
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setTextAlignStyle("left")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #555",
              background: textAlignStyle === "left" ? "#2e7d32" : "#0f0f0f",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
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
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="18" y2="18" />
              </svg>
              {t("left")}
            </span>
          </button>
          <button
            onClick={() => setTextAlignStyle("center")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #555",
              background: textAlignStyle === "center" ? "#2e7d32" : "#0f0f0f",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
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
                <line x1="6" y1="6" x2="18" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="6" y1="18" x2="18" y2="18" />
              </svg>
              {t("center")}
            </span>
          </button>
          <button
            onClick={() => setTextAlignStyle("right")}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #555",
              background: textAlignStyle === "right" ? "#2e7d32" : "#0f0f0f",
              color: "white",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
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
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="9" y1="12" x2="21" y2="12" />
                <line x1="6" y1="18" x2="21" y2="18" />
              </svg>
              {t("right")}
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("lineHeight")}: {lineHeight.toFixed(1)}
        </label>
        <CustomSlider
          min={1}
          max={3}
          step={0.1}
          value={lineHeight}
          onChange={setLineHeight}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("paragraphSpacing")}: {paragraphSpacingPx}px
        </label>
        <CustomSlider
          min={0}
          max={40}
          value={paragraphSpacingPx}
          onChange={setParagraphSpacingPx}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("autoScrollSpeed")}: {scrollSpeed}
        </label>
        <CustomSlider
          min={10}
          max={200}
          value={scrollSpeed}
          onChange={setScrollSpeed}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("lookaheadWindow")}: {lookaheadWindow} {t("words")}
        </label>
        <CustomSlider
          min={1}
          max={40}
          value={lookaheadWindow}
          onChange={setLookaheadWindow}
        />
        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
          {t("lookaheadHelp")}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("paragraphLookahead")}: {paragraphLookahead} {t("paragraphs")}
        </label>
        <CustomSlider
          min={0}
          max={6}
          value={paragraphLookahead}
          onChange={setParagraphLookahead}
        />
        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
          {t("paragraphLookaheadHelp")}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("coHostLines")}: {skipCoHostLines ? t("skip") : t("off")}
        </label>
        <button
          onClick={() => setSkipCoHostLines(!skipCoHostLines)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #555",
            background: skipCoHostLines ? "#2e7d32" : "#37474f",
            color: "white",
            cursor: "pointer",
          }}
          aria-label="Toggle co-host line skipping"
          title={t("coHostLinesTitle")}
        >
          {skipCoHostLines ? t("enabled") : t("enable")}
        </button>
        <div style={{ color: "#aaa", fontSize: "12px", marginTop: "4px" }}>
          {t("coHostLinesHelp")}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("textOpacity")}: {Math.round(textOpacity * 100)}%
        </label>
        <CustomSlider
          min={0.2}
          max={1}
          step={0.05}
          value={textOpacity}
          onChange={setTextOpacity}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("aimOpacity")}: {Math.round(aimOpacity * 100)}%
        </label>
        <CustomSlider
          min={0}
          max={1}
          step={0.05}
          value={aimOpacity}
          onChange={setAimOpacity}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("paragraphHighlightOpacity")}:{" "}
          {Math.round(paragraphHighlightOpacity * 100)}%
        </label>
        <CustomSlider
          min={0}
          max={0.6}
          step={0.02}
          value={paragraphHighlightOpacity}
          onChange={setParagraphHighlightOpacity}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("operationButtonsOpacity")}: {Math.round(uiOpacity * 100)}%
        </label>
        <CustomSlider
          min={0.2}
          max={1}
          step={0.05}
          value={uiOpacity}
          onChange={setUiOpacity}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("toolbarPosition")}: {t(toolbarPosition)}
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {["top", "bottom"].map((pos) => (
            <button
              key={pos}
              onClick={() => setToolbarPosition(pos)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #555",
                background: toolbarPosition === pos ? "#2e7d32" : "#37474f",
                color: "white",
                cursor: "pointer",
              }}
            >
              {t(pos)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("showAimMarker")}: {showAim ? t("enabled") : t("disabled")}
        </label>
        <button
          onClick={() => setShowAim(!showAim)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #555",
            background: showAim ? "#2e7d32" : "#37474f",
            color: "white",
            cursor: "pointer",
            marginBottom: "10px",
          }}
          aria-label="Toggle Aim Indicator"
        >
          {showAim ? t("disabled") : t("enable")}
        </button>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                color: "white",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {t("aimMarkerStyle")}
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                ["crosshair", t("crosshair")],
                ["dot", t("dot")],
                ["frame", t("frame")],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setAimStyle(value)}
                  aria-label={`${t("aimMarkerStyle")}: ${label}`}
                  aria-pressed={aimStyle === value}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: "6px",
                    border:
                      aimStyle === value
                        ? "1px solid #90caf9"
                        : "1px solid #555",
                    background: aimStyle === value ? "#1565c0" : "#37474f",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                color: "white",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {t("aimMarkerColor")}
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                ["#ffeb3b", "Yellow"],
                ["#2196f3", "Blue"],
                ["#f44336", "Red"],
                ["#4caf50", "Green"],
                ["#ffffff", "White"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setAimColor(value)}
                  title={label}
                  aria-label={`Marker color: ${label}`}
                  aria-pressed={aimColor === value}
                  style={{
                    flex: 1,
                    height: "34px",
                    borderRadius: "6px",
                    border:
                      aimColor === value
                        ? "2px solid white"
                        : "1px solid #555",
                    background: value,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                color: "white",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {t("horizontalOffset")}: {aimOffsetX}px
            </label>
            <CustomSlider
              min={-400}
              max={400}
              value={aimOffsetX}
              onChange={setAimOffsetX}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                color: "white",
                display: "block",
                marginBottom: "8px",
              }}
            >
              {t("verticalOffset")}: {aimOffsetY}px
            </label>
            <CustomSlider
              min={-300}
              max={300}
              value={aimOffsetY}
              onChange={setAimOffsetY}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setAimOffsetX(0);
            setAimOffsetY(0);
          }}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #555",
            background: "#37474f",
            color: "white",
            cursor: "pointer",
            marginTop: "10px",
            fontSize: "14px",
            fontWeight: "500",
          }}
          title={t("resetToCenter")}
        >
          {t("resetToCenter")}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("listeningIndicator")}:{" "}
          {showListeningIndicator ? t("visible") : t("hidden")}
        </label>
        <button
          onClick={() => setShowListeningIndicator(!showListeningIndicator)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #555",
            background: showListeningIndicator ? "#2e7d32" : "#37474f",
            color: "white",
            cursor: "pointer",
          }}
          aria-label="Toggle Listening Indicator"
          title={t("hideWhileRecording")}
        >
          {showListeningIndicator ? t("hideWhileRecording") : t("show")}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("supportPrompts")}: {showSupportPrompts ? t("visible") : t("hidden")}
        </label>
        <button
          onClick={() => {
            const next = !showSupportPrompts;
            setShowSupportPrompts(next);
            if (!next) setShowSupportMessage(false);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #555",
            background: showSupportPrompts ? "#2e7d32" : "#37474f",
            color: "white",
            cursor: "pointer",
          }}
          aria-label="Toggle Support Prompts"
          title={t("supportPrompts")}
        >
          {showSupportPrompts ? t("hideEverywhere") : t("show")}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("textCenteringOffset")}: {centerPaddingVh}vh
        </label>
        <CustomSlider
          min={0}
          max={60}
          value={centerPaddingVh}
          onChange={setCenterPaddingVh}
          onDragStart={() => setShowCenterLine(true)}
          onDragEnd={() => setShowCenterLine(false)}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("backgroundColor")}
        </label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          style={{ width: "100%", height: "40px", cursor: "pointer" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("textColor")}
        </label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          style={{ width: "100%", height: "40px", cursor: "pointer" }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            color: "white",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {t("highlightColor")}
        </label>
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => setHighlightColor(e.target.value)}
          style={{ width: "100%", height: "40px", cursor: "pointer" }}
        />
      </div>
    </>
  );
}
