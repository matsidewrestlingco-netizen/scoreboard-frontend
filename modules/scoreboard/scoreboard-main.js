// =========================================================
// FILE: modules/scoreboard/scoreboard-main.js
// Wire socket -> state -> render for single-mat scoreboard
// =========================================================
import { initSocketClient } from "../core/socket.js";
import { getMatState } from "../core/state-router.js";
import { computeWinnerForView } from "../core/segment-engine.js";
import { initScoreboardView, updateScoreboardView } from "./scoreboard-render.js";

function getMatFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const m = parseInt(params.get("mat"), 10);
  if (!Number.isFinite(m) || m < 1 || m > 4) return 1;
  return m;
}

const mat = getMatFromQuery();
const view = initScoreboardView();

// initial mat label
if (view.matEl) view.matEl.textContent = mat;

function handleStateUpdate(state) {
  const matState = getMatState(state, mat);
  if (!matState) return;

  const winner = computeWinnerForView(matState);

  const meta = {
    mat,
    isConnected: true,
    winner
  };

  updateScoreboardView(view, matState, meta);
}

// Initialize socket connection for scoreboard role
initSocketClient({
  role: "scoreboard",
  mat,
  onState: handleStateUpdate
});
