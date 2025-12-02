// =======================================================
// File: /modules/core/period-name.js
// Consistent label generator for REG/OT/TB/UT segments
// =======================================================

export function segmentLabel(segmentId, fallbackPeriod = 1) {
  if (!segmentId) return String(fallbackPeriod);

  // REG1 → "1"
  if (segmentId.startsWith("REG")) {
    const num = parseInt(segmentId.slice(3), 10);
    return Number.isFinite(num) ? String(num) : String(fallbackPeriod);
  }

  // OT, TB1, TB2, UT → Display as-is
  return segmentId;
}
