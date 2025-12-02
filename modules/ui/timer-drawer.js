// modules/ui/timer-drawer.js
// -------------------------------------------------------
// Contains timer presets + custom control logic
// -------------------------------------------------------

export function initTimerDrawer(stateApi, getMat) {
  const presetButtons = document.querySelectorAll("[data-preset]");
  const customInput = document.getElementById("customTimeInput");
  const applyCustom = document.getElementById("applyCustomTime");

  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const sec = Number(btn.dataset.preset);
      stateApi.update(getMat(), { time: sec });
    });
  });

  applyCustom?.addEventListener("click", () => {
    const raw = customInput.value.trim();
    let sec = 0;

    if (raw.includes(":")) {
      const [m, s] = raw.split(":");
      sec = Number(m)*60 + Number(s);
    } else {
      sec = Number(raw);
    }

    if (!isNaN(sec)) {
      stateApi.update(getMat(), { time: sec });
    }
  });
}
