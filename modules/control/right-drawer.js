// modules/ui/right-drawer.js
// -------------------------------------------------------
// Wrestler names + Reset Mat controls
// -------------------------------------------------------

export function initRightDrawer(stateApi, getMat) {
  const redName = document.getElementById("redNameInput");
  const greenName = document.getElementById("greenNameInput");
  const resetBtn = document.getElementById("resetMatBtn");

  redName?.addEventListener("input", () => {
    stateApi.update(getMat(), { redName: redName.value });
  });

  greenName?.addEventListener("input", () => {
    stateApi.update(getMat(), { greenName: greenName.value });
  });

  resetBtn?.addEventListener("click", () => {
    const mat = getMat();
    stateApi.update(mat, {
      red: 0,
      green: 0,
      time: 60,
      period: 1,
      segmentId: "P1",
      running: false,
      redName: "",
      greenName: "",
      timeline: []
    });
  });
}
