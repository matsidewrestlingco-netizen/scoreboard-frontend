// =========================================================
// FILE: modules/core/period-name.js
// Thin wrapper for converting segmentId → label text
// =========================================================
import { mapSegmentLabel } from "./segment-engine.js";

export function segmentLabelToDisplay(segmentId) {
  return mapSegmentLabel(segmentId || "REG1");
}
