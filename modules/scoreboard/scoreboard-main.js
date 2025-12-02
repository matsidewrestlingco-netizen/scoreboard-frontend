// ================================================
// FILE: modules/scoreboard/scoreboard-main.js
// Socket wiring for single-mat scoreboard
// ================================================
import { initSocketClient } from "../core/socket.js";
import { initScoreboardView, updateScoreboardView } from "./scoreboard-render.js";

function getMatFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const m = parseInt(params.get("mat"), 10);
  if (!Number.isFinite(m) || m < 1 || m > 4) return 1;
  return m;
}

const mat = getMatFromQuery();
const view = initScoreboardView();

function handleStateUpdate(state) {
  if (!state || !state.mats || !view) return;
  const matState = state.mats[mat];
  if (!matState) return;

  const meta = { mat };
  updateScoreboardView(view, matState, meta);
}

// Init socket client for this mat's scoreboard
initSocketClient({
  role: "scoreboard",
  mat,
  onState: handleStateUpdate
});
