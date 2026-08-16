export default function ShortcutsHelpModal({ t, appVersion, onClose }) {
  const shortcuts = [
    ["V", t("shortcutsStartStopMic")],
    ["P", t("shortcutsAutoScroll")],
    ["H", t("shortcutsHighlight")],
    ["R", t("shortcutsReset")],
    ["L", t("shortcutsLanguage")],
    ["E", t("shortcutsSettings")],
    ["S", t("shortcutsEditor")],
    ["B", t("shortcutsMyScripts")],
    ["F", t("shortcutsFullscreen")],
    ["M", t("shortcutsMirror")],
    ["?", t("shortcutsPanel")],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 20000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111",
          border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "480px",
          width: "calc(100vw - 40px)",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ color: "white", margin: 0, fontSize: "20px" }}>
            ⌨️ {t("keyboardShortcuts")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#999",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>
        {shortcuts.map(([key, desc]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: "#1a1a1a",
              borderRadius: "8px",
              marginBottom: "6px",
            }}
          >
            <span style={{ color: "#ccc", fontSize: "14px" }}>{desc}</span>
            <kbd
              style={{
                background: "#333",
                color: "white",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "monospace",
                fontWeight: "bold",
                border: "1px solid #555",
                minWidth: "28px",
                textAlign: "center",
              }}
            >
              {key}
            </kbd>
          </div>
        ))}
        <div
          style={{
            textAlign: "center",
            color: "#888",
            fontSize: "12px",
            marginTop: "16px",
          }}
        >
          Smart Teleprompter v{appVersion}
        </div>
      </div>
    </div>
  );
}
