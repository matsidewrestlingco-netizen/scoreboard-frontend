// =========================================================
// FILE: modules/scoreboard/scoreboard-render.js
// DOM wiring + view updates for the scoreboard
// =========================================================
import { segmentLabelToDisplay } from "../core/period-name.js";
import { formatTime } from "../shared/helpers.js";
import { computeWinnerForView } from "../core/segment-engine.js";

export function initScoreboardView() {
  return {
    matEl: document.getElementById("sb-mat"),
    statusEl: document.getElementById("sb-status"),
    timeEl: document.getElementById("sb-time"),
    periodEl: document.getElementById("sb-period"),
    redScoreEl: document.getElementById("sb-red-score"),
    greenScoreEl: document.getElementById("sb-green-score"),
    connEl: document.getElementById("sb-conn"),
    redNameEl: document.getElementById("sb-red-name"),
    greenNameEl: document.getElementById("sb-green-name")
  };
}

export function updateScoreboardView(view, matState, meta) {
  if (!view || !matState) return;

  const segId = matState.segmentId || "REG1";
  const time = matState.time ?? 0;
  const red = matState.red ?? 0;
  const green = matState.green ?? 0;

  if (view.matEl && meta?.mat) view.matEl.textContent = meta.mat;
  if (view.statusEl) view.statusEl.textContent = matState.running ? "Running" : "Stopped";
  if (view.timeEl) view.timeEl.textContent = formatTime(time);
  if (view.periodEl) view.periodEl.textContent = segmentLabelToDisplay(segId);
  if (view.redScoreEl) view.redScoreEl.textContent = red;
  if (view.greenScoreEl) view.greenScoreEl.textContent = green;
  if (view.connEl && meta) view.connEl.textContent = meta.isConnected ? "connected" : "disconnected";

  // Winner highlighting (for spectators)
  const winner = meta?.winner || computeWinnerForView(matState);
  resetWinnerHighlight(view);

  if (!winner) return;
  if (winner === "red" && view.redScoreEl) {
    view.redScoreEl.style.boxShadow = "0 0 18px rgba(211,47,47,0.9)";
  } else if (winner === "green" && view.greenScoreEl) {
    view.greenScoreEl.style.boxShadow = "0 0 18px rgba(46,125,50,0.9)";
  }
}

function resetWinnerHighlight(view) {
  if (view.redScoreEl) view.redScoreEl.style.boxShadow = "none";
  if (view.greenScoreEl) view.greenScoreEl.style.boxShadow = "none";
}
