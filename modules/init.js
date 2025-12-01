// modules/init.js
import { initSocket, setCurrentMat, getCurrentMat } from "./socketHandler.js";
import { initToasts } from "./toasts.js";
import { initTimer, applyTimerState } from "./timer.js";
import { initScoring, applyScoreState } from "./scoring.js";
import { initDrawers } from "./drawers.js";
import { initTimeline } from "./timeline.js";
import { initEndMatch } from "./endMatch.js";

function onStateUpdate(state) {
  const mat = getCurrentMat();
  const m = state && state.mats ? state.mats[mat] : null;
  if (!m) return;

  const sumMatEl = document.getElementById("sumMat");
  if (sumMatEl) sumMatEl.textContent = mat;

  applyTimerState(m);
  applyScoreState(m);
}

function initMatSelect() {
  const matSelect = document.getElementById("matSelect");
  if (!matSelect) return;
  matSelect.addEventListener("change", () => {
    const val = parseInt(matSelect.value, 10) || 1;
    setCurrentMat(val);
  });
}

function init() {
  initToasts();
  initTimeline();
  initTimer();
  initScoring();
  initDrawers();
  initEndMatch();
  initMatSelect();
  initSocket(onStateUpdate);
}

document.addEventListener("DOMContentLoaded", init);
