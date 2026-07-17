// Reusable drag slider used throughout the settings panel (font size, speed,
// opacities, offsets, etc). Uses the Pointer Events API instead of separate
// mouse/touch listeners so dragging works with mouse, touch and pen alike.
export default function CustomSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  onDragStart,
  onDragEnd,
}) {
  const precision = Math.round(1 / step);
  const clamp = (v) => Math.max(min, Math.min(max, v));
  const roundToStep = (v) => Math.round(v * precision) / precision;
  const valueFromClientX = (clientX, rect) => {
    const percentage = (clientX - rect.left) / rect.width;
    return clamp(roundToStep(min + percentage * (max - min)));
  };

  return (
    <div
      className="custom-slider"
      onClick={(e) => {
        if (e.target.classList.contains("custom-slider-thumb")) return;
        onChange(
          valueFromClientX(e.clientX, e.currentTarget.getBoundingClientRect())
        );
      }}
      onPointerDown={() => onDragStart?.()}
      onPointerUp={() => onDragEnd?.()}
    >
      <div className="custom-slider-track" />
      <div
        className="custom-slider-thumb"
        style={{
          left: `calc(${((value - min) / (max - min)) * 100}% - 8px)`,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          const thumb = e.currentTarget;
          thumb.setPointerCapture(e.pointerId);
          const rect = thumb.parentElement.getBoundingClientRect();
          const startX = e.clientX;
          const startValue = value;
          onDragStart?.();

          const handlePointerMove = (moveEvent) => {
            const deltaPercentage = (moveEvent.clientX - startX) / rect.width;
            onChange(
              clamp(roundToStep(startValue + deltaPercentage * (max - min)))
            );
          };

          const stopDragging = () => {
            thumb.removeEventListener("pointermove", handlePointerMove);
            thumb.removeEventListener("pointerup", stopDragging);
            thumb.removeEventListener("pointercancel", stopDragging);
            onDragEnd?.();
          };

          thumb.addEventListener("pointermove", handlePointerMove);
          thumb.addEventListener("pointerup", stopDragging);
          thumb.addEventListener("pointercancel", stopDragging);
        }}
      />
    </div>
  );
}
