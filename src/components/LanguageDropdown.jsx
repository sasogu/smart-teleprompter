export default function LanguageDropdown({
  languagesList,
  language,
  menuPos,
  onSelect,
}) {
  return (
    <div
      data-language-dropdown
      style={{
        position: "fixed",
        top: menuPos.top,
        left: menuPos.left,
        background: "rgba(0,0,0,0.95)",
        color: "white",
        border: "1px solid #555",
        borderRadius: 8,
        padding: 10,
        zIndex: 1500,
        maxHeight: 400,
        overflowY: "auto",
        minWidth: 220,
        maxWidth: "calc(100vw - 40px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      {languagesList.map((lng) => (
        <button
          key={lng.code}
          onClick={() => onSelect(lng.code)}
          style={{
            width: "100%",
            textAlign: "left",
            border: "1px solid #444",
            background: language === lng.code ? "#2e7d32" : "#222",
            color: "white",
            padding: "8px 10px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {language === lng.code ? (
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
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <span style={{ width: 16, display: "inline-block" }} />
          )}
          <span>
            {lng.label} — {lng.code}
          </span>
        </button>
      ))}
    </div>
  );
}
