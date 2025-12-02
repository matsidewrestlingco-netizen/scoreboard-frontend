// =======================================================
// File: /modules/control/reset-mat.js
// Full mat reset: scores, time, segment, names, timeline.
// =======================================================

export function initResetMat(ctx) {
  const { updateState, getCurrentMat } = ctx;
  const resetBtn = document.getElementById("resetMatBtn");

  function resetMat() {
    const mat = getCurrentMat();
    updateState(mat, {
      red: 0,
      green: 0,
      running: false,
      time: 60,
      period: 1,
      segmentId: "P1"
      // Names + timeline remain client-side in other modules.
    });

    const redInput = document.getElementById("redNameInput");
    const greenInput = document.getElementById("greenNameInput");
    if (redInput) redInput.value = "";
    if (greenInput) greenInput.value = "";

    const timelineBox = document.getElementById("timelineBox");
    if (timelineBox) timelineBox.innerHTML = "";
  }

  resetBtn?.addEventListener("click", resetMat);

  return { resetMat };
}

