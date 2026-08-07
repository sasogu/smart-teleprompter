export function computeAutoIntervalMs(speedSetting) {
  const s = Math.max(1, Math.min(100, Number(speedSetting) || 1));
  return Math.max(150, Math.round(2200 - s * 20));
}
