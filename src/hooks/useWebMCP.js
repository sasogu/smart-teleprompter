import { useEffect, useRef } from "react";

// Exposes teleprompter controls to browser AI agents via the WebMCP
// navigator.modelContext API. The ref indirection keeps tool callbacks
// reachable from the latest handlers/state without re-registering tools
// on every render.
export default function useWebMCP({
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
}) {
  const webmcpApiRef = useRef({});
  useEffect(() => {
    webmcpApiRef.current = {
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
    };
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.modelContext) return;

    const ok = (text) => ({ content: [{ type: "text", text }] });
    const clampNum = (v, min, max, fallback) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.max(min, Math.min(max, n));
    };

    const tools = [
      {
        name: "load_script",
        description:
          "Replace the teleprompter script with new text. Optionally set the spoken language (BCP-47 code, e.g. en-US, el-GR).",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The full script text to display.",
            },
            language: {
              type: "string",
              description: "Optional BCP-47 language code, e.g. en-US or el-GR.",
            },
          },
          required: ["text"],
        },
        async execute({ text, language } = {}) {
          const api = webmcpApiRef.current;
          const value = String(text ?? "");
          api.setText(value);
          if (language) api.setLanguage(String(language));
          return ok(
            `Loaded script (${value.length} characters)` +
              (language ? `, language ${language}.` : ".")
          );
        },
      },
      {
        name: "start_autoscroll",
        description:
          "Start automatic scrolling of the teleprompter at the current speed.",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          const api = webmcpApiRef.current;
          if (!api.isPlaying) api.toggleAutoPlay();
          return ok("Auto-scroll started.");
        },
      },
      {
        name: "start_voice_tracking",
        description:
          "Start microphone voice tracking so the teleprompter follows the reader's speech. Requires mic permission; desktop Chrome recommended.",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          const api = webmcpApiRef.current;
          if (!api.isListening) api.toggleListening();
          return ok("Voice tracking started.");
        },
      },
      {
        name: "stop",
        description:
          "Stop auto-scroll and voice tracking and reset the reading position to the top.",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          webmcpApiRef.current.resetPosition();
          return ok("Stopped and reset to the beginning.");
        },
      },
      {
        name: "set_speed",
        description: "Set the auto-scroll speed (1 = slowest, 100 = fastest).",
        inputSchema: {
          type: "object",
          properties: {
            speed: { type: "number", minimum: 1, maximum: 100 },
          },
          required: ["speed"],
        },
        async execute({ speed } = {}) {
          const v = clampNum(speed, 1, 100, 88);
          webmcpApiRef.current.setScrollSpeed(v);
          return ok(`Scroll speed set to ${v}.`);
        },
      },
      {
        name: "set_font_size",
        description: "Set the teleprompter font size in pixels (12–200).",
        inputSchema: {
          type: "object",
          properties: {
            size: { type: "number", minimum: 12, maximum: 200 },
          },
          required: ["size"],
        },
        async execute({ size } = {}) {
          const v = clampNum(size, 12, 200, 32);
          webmcpApiRef.current.setFontSize(v);
          return ok(`Font size set to ${v}px.`);
        },
      },
      {
        name: "set_language",
        description:
          "Set the speech-recognition language using a BCP-47 code (e.g. en-US, el-GR, es-ES).",
        inputSchema: {
          type: "object",
          properties: { language: { type: "string" } },
          required: ["language"],
        },
        async execute({ language } = {}) {
          webmcpApiRef.current.setLanguage(String(language));
          return ok(`Language set to ${language}.`);
        },
      },
      {
        name: "list_scripts",
        description:
          "List the saved scripts in the user's local library (name and language).",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          const scripts = webmcpApiRef.current.savedScripts || [];
          if (!scripts.length) return ok("No saved scripts.");
          return ok(
            scripts
              .map((s, i) => `${i + 1}. ${s.name} [${s.language || "en-US"}]`)
              .join("\n")
          );
        },
      },
      {
        name: "load_saved_script",
        description:
          "Load a saved script from the library by its name (case-insensitive).",
        inputSchema: {
          type: "object",
          properties: { name: { type: "string" } },
          required: ["name"],
        },
        async execute({ name } = {}) {
          const api = webmcpApiRef.current;
          const scripts = api.savedScripts || [];
          const target = scripts.find(
            (s) =>
              (s.name || "").toLowerCase() === String(name).toLowerCase()
          );
          if (!target) return ok(`No saved script named "${name}".`);
          api.loadScript(target);
          return ok(`Loaded "${target.name}".`);
        },
      },
      {
        name: "get_state",
        description:
          "Get the current teleprompter state: auto-scroll/voice status, language, speed and font size.",
        inputSchema: { type: "object", properties: {} },
        async execute() {
          const a = webmcpApiRef.current;
          return ok(
            JSON.stringify({
              autoScrolling: !!a.isPlaying,
              voiceTracking: !!a.isListening,
              language: a.language,
              scrollSpeed: a.scrollSpeed,
              fontSize: a.fontSize,
            })
          );
        },
      },
    ];

    try {
      const mc = navigator.modelContext;
      if (typeof mc.provideContext === "function") {
        mc.provideContext({ tools });
      } else if (typeof mc.registerTool === "function") {
        tools.forEach((t) => mc.registerTool(t));
      }
    } catch (err) {
      console.error("WebMCP registration failed:", err);
    }
  }, []);
}
