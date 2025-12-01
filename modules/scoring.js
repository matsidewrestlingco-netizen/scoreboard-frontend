// modules/scoring.js
import { addPoints, subPoint, updateMatState } from "./socketHandler.js";
import { addTimelineEntry } from "./timeline.js";

let sumRedEl, sumGreenEl;

export function initScoring() {
  sumRedEl = document.getElementById("sumRed");
  sumGreenEl = document.getElementById("sumGreen");

  document.querySelectorAll(".score-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      const pts = parseInt(btn.dataset.pts, 10) || 0;
      if (!color || !pts) return;
      addPoints(color, pts);
      addTimelineEntry({
        type: "score",
        color,
        pts,
        label: btn.textContent.trim()
      });
    });
  });

  const subRedBtn = document.getElementById("subRed");
  const subGreenBtn = document.getElementById("subGreen");
  const resetScoresBtn = document.getElementById("resetScores");

  if (subRedBtn) subRedBtn.onclick = () => {
    subPoint("red");
    addTimelineEntry({ type:"adjust", color:"red", pts:-1, label:"-1 Red" });
  };
  if (subGreenBtn) subGreenBtn.onclick = () => {
    subPoint("green");
    addTimelineEntry({ type:"adjust", color:"green", pts:-1, label:"-1 Green" });
  };
  if (resetScoresBtn) resetScoresBtn.onclick = () => {
    updateMatState({ red:0, green:0 });
    addTimelineEntry({ type:"reset-scores", label:"Scores reset" });
  };
}

export function applyScoreState(matState) {
  if (!matState) return;
  if (sumRedEl) sumRedEl.textContent = matState.red ?? 0;
  if (sumGreenEl) sumGreenEl.textContent = matState.green ?? 0;
}
