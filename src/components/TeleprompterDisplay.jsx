import TeleprompterLine from "./TeleprompterLine.jsx";

export default function TeleprompterDisplay({
  textContainerRef,
  centerPaddingVh,
  sidePaddingVw,
  fontSize,
  lineHeight,
  textColor,
  textOpacity,
  textAlignStyle,
  showAim,
  aimOffsetX,
  aimOffsetY,
  aimColor,
  aimOpacity,
  aimStyle,
  mirrorX,
  linesWords,
  lineStartIndex,
  currentWordIndex,
  skipCoHostLines,
  lineIsCoHost,
  lineStyles,
  showHighlight,
  highlightColor,
  paragraphSpacingPx,
  paragraphHighlightOpacity,
  setCurrentWordIndex,
  extraBottomSpacePx,
}) {
  return (
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
  );
}
