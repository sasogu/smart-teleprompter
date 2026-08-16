export default function AddEditScriptModal({
  t,
  languagesList,
  editScriptId,
  addScriptName,
  setAddScriptName,
  addScriptLanguage,
  setAddScriptLanguage,
  addScriptText,
  setAddScriptText,
  scriptFormTouched,
  onClose,
  onSave,
  onSaveAndLoad,
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.85)",
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
          padding: "28px",
          maxWidth: "540px",
          width: "calc(100vw - 40px)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ color: "white", margin: 0, fontSize: "18px" }}>
            {editScriptId ? t("editScriptTitle") : t("addScriptTitle")}
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

        <label
          style={{
            color: "#aaa",
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          {t("scriptName")}
        </label>
        <input
          type="text"
          value={addScriptName}
          onChange={(e) => setAddScriptName(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={t("scriptNamePlaceholder")}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: `1px solid ${
              scriptFormTouched && !addScriptName.trim() ? "#b71c1c" : "#444"
            }`,
            background: "#1a1a1a",
            color: "white",
            fontSize: "14px",
            outline: "none",
            marginBottom:
              scriptFormTouched && !addScriptName.trim() ? "4px" : "12px",
          }}
        />
        {scriptFormTouched && !addScriptName.trim() && (
          <div
            style={{ color: "#ef5350", fontSize: "12px", marginBottom: "8px" }}
          >
            {t("scriptNameRequired")}
          </div>
        )}

        <label
          style={{
            color: "#aaa",
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          {t("language")}
        </label>
        <select
          value={addScriptLanguage}
          onChange={(e) => setAddScriptLanguage(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #444",
            background: "#1a1a1a",
            color: "white",
            fontSize: "14px",
            outline: "none",
            marginBottom: "12px",
            cursor: "pointer",
          }}
        >
          {languagesList.map((lng) => (
            <option key={lng.code} value={lng.code}>
              {lng.label}
            </option>
          ))}
        </select>

        <label
          style={{
            color: "#aaa",
            fontSize: "12px",
            marginBottom: "4px",
          }}
        >
          {t("scriptText")}
        </label>
        <textarea
          value={addScriptText}
          onChange={(e) => setAddScriptText(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={t("scriptTextPlaceholder")}
          style={{
            flex: 1,
            minHeight: "200px",
            padding: "12px 14px",
            borderRadius: "8px",
            border: `1px solid ${
              scriptFormTouched && !addScriptText.trim() ? "#b71c1c" : "#444"
            }`,
            background: "#1a1a1a",
            color: "white",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            resize: "vertical",
            marginBottom:
              scriptFormTouched && !addScriptText.trim() ? "4px" : "16px",
          }}
        />
        {scriptFormTouched && !addScriptText.trim() && (
          <div
            style={{
              color: "#ef5350",
              fontSize: "12px",
              marginBottom: "12px",
            }}
          >
            {t("scriptTextRequired")}
          </div>
        )}
        <div
          style={{
            color: "#888",
            fontSize: "12px",
            marginTop: "-8px",
            marginBottom: "12px",
            lineHeight: 1.5,
          }}
        >
          💡 {t("coHostTip")}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #555",
              background: "#333",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {t("cancel")}
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#2e7d32",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {t("save")}
          </button>
          <button
            onClick={onSaveAndLoad}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#1565c0",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {t("saveAndLoad")}
          </button>
        </div>
      </div>
    </div>
  );
}
