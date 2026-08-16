export default function ResetConfirmModal({ t, onCancel, onConfirm }) {
  return (
    <div
      onClick={onCancel}
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
          maxWidth: "400px",
          width: "calc(100vw - 40px)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
        <h2
          style={{
            color: "white",
            margin: "0 0 12px",
            fontSize: "20px",
          }}
        >
          {t("resetAllSettingsTitle")}
        </h2>
        <p
          style={{
            color: "#aaa",
            fontSize: "14px",
            lineHeight: "1.5",
            margin: "0 0 24px",
          }}
        >
          {t("resetAllSettingsBody")}
        </p>
        <div
          style={{ display: "flex", gap: "12px", justifyContent: "center" }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "1px solid #555",
              background: "#333",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#b71c1c",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {t("reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
