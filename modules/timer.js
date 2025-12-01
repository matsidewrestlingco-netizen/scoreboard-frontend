// timer.js module
import { updateMatState, getLastState } from "./socketHandler.js";
import { getNextSegment, getSegmentById } from "./periodLogic.js";
import { addTimelineEntry } from "./timeline.js";

let sumTimeEl, sumPeriodEl, timerRunningClassTarget;
let startBtn, stopBtn, resetTimerBtn;
let presetButtons, customSecondsInput, applyCustomBtn;

let prevTime = null;
let prevSegmentId = null;

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
  if (timerRunningClassTarget) timerRunningClassTarget.classList.add("timer-running");
}

function handleStop() {
  updateMatState({ running: false });
  if (timerRunningClassTarget) timerRunningClassTarget.classList.remove("timer-running");
}

function handleResetTimer() {
  updateMatState({ time: 0, running: false });
  if (timerRunningClassTarget) timerRunningClassTarget.classList.remove("timer-running");
}

export function applyTimerState(matState) {
  if (!matState) return;

  const time = matState.time || 0;
  const segId = matState.segmentId || "REG1";

  if (sumTimeEl) sumTimeEl.textContent = formatTime(time);

  if (sumPeriodEl) {
    const seg = getSegmentById(segId);
    sumPeriodEl.textContent = seg ? seg.label : (matState.period || 1);
  }

  if (timerRunningClassTarget) {
    if (matState.running) timerRunningClassTarget.classList.add("timer-running");
    else timerRunningClassTarget.classList.remove("timer-running");
  }

  if (prevTime !== null && prevTime > 0 && time === 0) {
    handleSegmentComplete(matState);
  }

  prevTime = time;
  prevSegmentId = segId;
}

function handleSegmentComplete(m) {
  const segId = m.segmentId || "REG1";
  const red = m.red || 0;
  const green = m.green || 0;

  const next = getNextSegment(segId, red, green);

  if (next === null && segId !== "UT") {
    addTimelineEntry({ type: "period-end", label: "Match ended (no OT required)" });
    return;
  }

  if (next) {
    updateMatState({
      segmentId: next.id,
      time: next.time,
      running: false
    });
    addTimelineEntry({
      type: "period-change",
      label: `→ ${next.label}`
    });
  }
}

function formatTime(sec) {
  const s = Math.max(0, sec|0);
  const m = Math.floor(s / 60).toString().padStart(2,"0");
  const r = (s % 60).toString().padStart(2,"0");
  return `${m}:${r}`;
}
