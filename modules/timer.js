import { updateMatState } from "./socketHandler.js";
import { getNextSegment, shouldAutoEndMatch, getSegmentById } from "./periodLogic.js";
import { addTimelineEntry } from "./timeline.js";

// Called every time state updates
export function applyTimerState(matState) {
  if (!matState) return;

  // Display time
  if (sumTimeEl) sumTimeEl.textContent = formatTime(matState.time || 0);
  if (sumPeriodEl) {
    const seg = getSegmentById(matState.segmentId);
    sumPeriodEl.textContent = seg ? seg.label : matState.period;
  }

  // Flashing UI
  if (timerRunningClassTarget) {
    if (matState.running) timerRunningClassTarget.classList.add("timer-running");
    else timerRunningClassTarget.classList.remove("timer-running");
  }

  // Auto-transition logic
  if (!matState.running && matState.time === 0) {
    handleSegmentComplete(matState);
  }
}

// ---------------------------------------------------------------------------
// AUTO-PERIOD PROGRESSION
// ---------------------------------------------------------------------------
function handleSegmentComplete(m) {
  const next = getNextSegment(m.segmentId, m.red, m.green);

  // Winner determined (regulation or UT)
  if (next === null && m.segmentId !== "UT") {
    addTimelineEntry({ type: "period-end", label: "Match ended (no OT required)" });
    return; 
  }

  // Transition into next segment
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
