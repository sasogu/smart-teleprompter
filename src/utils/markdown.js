// (imported from App.jsx at module scope)
// DEFAULT_LINE_STYLE is defined in App.jsx — passed as default in getLinePresentationStyle

const DEFAULT_LINE_STYLE = { type: "paragraph", depth: 0 };

export function cleanMarkdownInline(input) {
  return input
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function markdownToTeleprompterLines(markdown) {
  const lines = markdown.split(/\r?\n/);
  const result = [];
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (/^```|^~~~/.test(trimmed)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      result.push({
        text: rawLine.trimEnd(),
        style: { type: "code", depth: 0 },
      });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      result.push({
        text: cleanMarkdownInline(heading[2]),
        style: { type: "heading", depth: heading[1].length },
      });
      continue;
    }

    const quote = trimmed.match(/^>\s?(.+)$/);
    if (quote) {
      result.push({
        text: cleanMarkdownInline(quote[1]),
        style: { type: "quote", depth: 0 },
      });
      continue;
    }

    const listItem = rawLine.match(/^(\s*)([-*+]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      const depth = Math.floor(listItem[1].replace(/\t/g, "  ").length / 2);
      const marker = /^\d/.test(listItem[2]) ? `${listItem[2]} ` : "- ";
      result.push({
        text: `${"  ".repeat(depth)}${marker}${cleanMarkdownInline(listItem[3])}`,
        style: { type: "list", depth },
      });
      continue;
    }

    result.push({
      text: cleanMarkdownInline(rawLine),
      style: { ...DEFAULT_LINE_STYLE },
    });
  }

  return result;
}

export function getLinePresentationStyle(lineStyle, paragraphSpacingPx) {
  const style = lineStyle || DEFAULT_LINE_STYLE;
  if (style.type === "heading") {
    const scale = style.depth <= 1 ? 1.45 : style.depth === 2 ? 1.28 : 1.12;
    return {
      fontSize: `${scale}em`,
      fontWeight: 700,
      marginTop: `${Math.max(10, paragraphSpacingPx)}px`,
      marginBottom: `${Math.max(6, paragraphSpacingPx / 2)}px`,
      letterSpacing: 0,
    };
  }
  if (style.type === "quote") {
    return {
      borderLeft: "4px solid currentColor",
      paddingLeft: "14px",
      opacity: 0.82,
      fontStyle: "italic",
    };
  }
  if (style.type === "code") {
    return {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      opacity: 0.9,
    };
  }
  if (style.type === "list") {
    return {
      paddingLeft: `${8 + Math.min(style.depth || 0, 4) * 18}px`,
    };
  }
  return {};
}
