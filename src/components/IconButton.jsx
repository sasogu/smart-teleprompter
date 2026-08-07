import { useState, useLayoutEffect, useRef } from "react";

export default function IconButton({
  onClick,
  ariaLabel,
  tooltipTitle,
  tooltipDesc,
  children,
  style,
  disabled,
  uiOpacity = 0.9,
}) {
  const [showTip, setShowTip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tipTimer = useRef(null);
  const buttonRef = useRef(null);
  const tipRef = useRef(null);

  const openWithDelay = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(hover: none)").matches
    )
      return;
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setTooltipPosition({
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        });
      }
      setShowTip(true);
    }, 200);
  };

  useLayoutEffect(() => {
    if (!showTip || !tipRef.current) return;
    const r = tipRef.current.getBoundingClientRect();
    let dx = 0;
    if (r.left < 8) dx = 8 - r.left;
    else if (r.right > window.innerWidth - 8)
      dx = window.innerWidth - 8 - r.right;
    if (dx !== 0)
      setTooltipPosition((p) => ({ ...p, left: p.left + dx }));
  }, [showTip]);

  const closeTip = () => {
    if (tipTimer.current) clearTimeout(tipTimer.current);
    setShowTip(false);
  };

  return (
    <div
      onMouseEnter={openWithDelay}
      onMouseLeave={closeTip}
      onFocus={openWithDelay}
      onBlur={closeTip}
      style={{ position: "relative", display: "inline-block", zIndex: 1 }}
    >
      <button
        ref={buttonRef}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
        style={{
          width: 44,
          height: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: 8,
          background: "#0f0f0f",
          color: "white",
          cursor: "pointer",
          opacity: uiOpacity,
          ...style,
        }}
      >
        {children}
      </button>
      {showTip && (
        <div
          ref={tipRef}
          style={{
            position: "fixed",
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            zIndex: 99999,
            pointerEvents: "none",
            fontSize: "13px",
            border: "1px solid rgba(255,255,255,0.1)",
            maxWidth: "300px",
            wordWrap: "break-word",
          }}
          role="tooltip"
        >
          <div style={{ fontWeight: "bold", marginBottom: 4, fontSize: 13 }}>
            {tooltipTitle}
          </div>
          {tooltipDesc && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>{tooltipDesc}</div>
          )}
        </div>
      )}
    </div>
  );
}
