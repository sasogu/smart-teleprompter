export default function ScriptList({
  t,
  languagesList,
  showScriptList,
  setShowScriptList,
  savedScripts,
  MAX_SCRIPTS,
  openAddScriptModal,
  openEditScriptModal,
  loadScript,
  setDeleteScriptConfirm,
}) {
  return (
    <div style={{ marginTop: "14px" }}>
      <button
        onClick={() => setShowScriptList((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid #444",
          background: showScriptList ? "#1a1a1a" : "#0f0f0f",
          color: "white",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        <span>
          📚 {t("myScripts")} ({savedScripts.length}/{MAX_SCRIPTS})
        </span>
        <span style={{ fontSize: "10px", color: "#888" }}>
          {showScriptList ? "▲" : "▼"}
        </span>
      </button>

      {showScriptList && (
        <div style={{ marginTop: "10px" }}>
          <button
            onClick={openAddScriptModal}
            disabled={savedScripts.length >= MAX_SCRIPTS}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px dashed #555",
              background: "transparent",
              color: savedScripts.length >= MAX_SCRIPTS ? "#555" : "#4fc3f7",
              cursor:
                savedScripts.length >= MAX_SCRIPTS ? "default" : "pointer",
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            + {t("addScript")}
          </button>

          {savedScripts.length === 0 ? (
            <div
              style={{
                color: "#666",
                fontSize: "13px",
                textAlign: "center",
                padding: "20px 12px",
                background: "#1a1a1a",
                borderRadius: "8px",
              }}
            >
              {t("noSavedScripts")}
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {savedScripts.map((script) => (
                <div
                  key={script.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#1a1a1a",
                    borderRadius: "6px",
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "white",
                        fontSize: "13px",
                        fontWeight: "bold",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {script.name}
                    </div>
                    <div
                      style={{
                        color: "#666",
                        fontSize: "10px",
                        marginTop: "1px",
                      }}
                    >
                      {(languagesList.find((l) => l.code === script.language) ||
                        {}
                      ).label ||
                        script.language ||
                        "—"}
                      {" · "}
                      {script.text.split(/\s+/).filter(Boolean).length}{" "}
                      {t("words")}
                    </div>
                  </div>
                  <button
                    onClick={() => loadScript(script)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "5px",
                      border: "none",
                      background: "#1565c0",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t("load")}
                  </button>
                  <button
                    onClick={() => openEditScriptModal(script)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "5px",
                      border: "1px solid #666",
                      background: "transparent",
                      color: "#ccc",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => setDeleteScriptConfirm(script)}
                    style={{
                      padding: "5px 8px",
                      borderRadius: "5px",
                      border: "1px solid #b71c1c",
                      background: "transparent",
                      color: "#ef5350",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
