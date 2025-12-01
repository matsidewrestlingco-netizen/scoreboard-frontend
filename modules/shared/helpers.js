// =========================================================
// FILE: modules/shared/helpers.js
// Common small helpers
// =========================================================
export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function formatTime(sec) {
  const s = safeNumber(sec, 0);
  const clamped = Math.max(0, s | 0);
  const m = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const r = (clamped % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}
