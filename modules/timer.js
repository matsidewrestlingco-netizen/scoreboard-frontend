// modules/timer.js
import { updateMatState, getCurrentMat, getLastState } from "./socketHandler.js";

let sumTimeEl, sumPeriodEl, timerRunningClassTarget;
let startBtn, stopBtn, resetTimerBtn;
let presetButtons, customSecondsInput, applyCustomBtn;

export function initTimer() {
  sumTimeEl = document.getElementById("sumTime");
  sumPeriodEl = document.getElementById("sumPeriod");
  timerRunningClassTarget = sumTimeEl;

  startBtn = document.getElementById("startBtn");
  stopBtn = document.getElementById("stopBtn");
  resetTimerBtn = document.getElementById("resetTimerBtn");

  presetButtons = document.querySelectorAll(".preset-btn");
  customSecondsInput = document.getElementById("customSecondsInput");
  applyCustomBtn = document.getElementById("applyCustomTime");

  if (startBtn) startBtn.onclick = handleStart;
  if (stopBtn) stopBtn.onclick = handleStop;
  if (resetTimerBtn) resetTimerBtn.onclick = handleResetTimer;

  presetButtons.forEach(btn => {
    btn.onclick = () => {
      const sec = parseInt(btn.dataset.sec, 10) || 60;
      updateMatState({ time: sec });
    };
  });

  if (applyCustomBtn) {
    applyCustomBtn.onclick = () => {
      const sec = parseInt(customSecondsInput.value, 10);
      if (!sec || sec < 10) return;
      updateMatState({ time: sec });
    };
  }
}

function handleStart() {
  updateMatState({ running: true });
  if (timerRunningClassTarget) {
    timerRunningClassTarget.classList.add("timer-running");
  }
}

function handleStop() {
  updateMatState({ running: false });
  if (timerRunningClassTarget) {
    timerRunningClassTarget.classList.remove("timer-running");
  }
}

function handleResetTimer() {
  // Simple: reset to 0 and stop; period logic can be added here later
  updateMatState({ time: 0, running: false });
  if (timerRunningClassTarget) {
    timerRunningClassTarget.classList.remove("timer-running");
  }
}

export function applyTimerState(matState) {
  if (!matState) return;
  if (sumTimeEl) sumTimeEl.textContent = formatTime(matState.time || 0);
  if (sumPeriodEl) sumPeriodEl.textContent = matState.period ?? 1;

  if (timerRunningClassTarget) {
    if (matState.running) timerRunningClassTarget.classList.add("timer-running");
    else timerRunningClassTarget.classList.remove("timer-running");
  }
}

function formatTime(sec) {
  const s = Math.max(0, sec|0);
  const m = Math.floor(s / 60).toString().padStart(2,"0");
  const r = (s % 60).toString().padStart(2,"0");
  return `${m}:${r}`;
}
