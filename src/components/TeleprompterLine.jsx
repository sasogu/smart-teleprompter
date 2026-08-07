import { memo } from "react";
import { getLinePresentationStyle } from "../utils/markdown.js";

const TeleprompterLine = memo(function TeleprompterLine({
  words,
  lineIdx,
  lineStart,
  activeIndex,
  isCoHost,
  lineStyle,
  showHighlight,
  highlightColor,
  textColor,
  paragraphSpacingPx,
  paragraphHighlightOpacity,
  onWordClick,
}) {
  const isCurrentLine = activeIndex >= 0;
  const presentationStyle = getLinePresentationStyle(
    lineStyle,
    paragraphSpacingPx
  );
  return (
    <div
      id={`line-${lineIdx}`}
      style={{
        padding: "4px 8px",
        margin: `${Math.max(0, paragraphSpacingPx / 4)}px 0`,
        borderRadius: "6px",
        backgroundColor: isCurrentLine
          ? `rgba(255, 235, 59, ${paragraphHighlightOpacity})`
          : "transparent",
        outline: isCurrentLine ? `1px dashed ${highlightColor}33` : "none",
        opacity: isCoHost ? 0.45 : 1,
        fontStyle: isCoHost ? "italic" : "normal",
        ...presentationStyle,
      }}
    >
      {words.map((word, i) => {
        const index = lineStart + i;
        const isCurrent = index === activeIndex;
        return (
          <span
            key={index}
            id={`word-${index}`}
            style={{
              backgroundColor:
                isCurrent && showHighlight ? highlightColor : "transparent",
              color: isCurrent && showHighlight ? "#000" : textColor,
              borderRadius: "2px",
              transition: "background-color 0.1s ease, color 0.1s ease",
              fontWeight: "normal",
              cursor: "pointer",
            }}
            onClick={() => onWordClick(index)}
          >
            {word}{" "}
          </span>
        );
      })}
    </div>
  );
});

export default TeleprompterLine;
