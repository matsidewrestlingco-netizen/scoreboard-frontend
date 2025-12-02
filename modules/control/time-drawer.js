// =======================================================
// File: /modules/control/time-drawer.js
// Timer Settings drawer: presets + custom time.
// =======================================================

export function initTimeDrawer(ctx) {
  const { updateState, getCurrentMat } = ctx;

  const presetButtons = document.querySelectorAll("[data-preset]");
  const customInput = document.getElementById("customTimeInput");
  const applyBtn = document.getElementById("applyCustomTime");

  function setTime(sec) {
    updateState(getCurrentMat(), { time: sec, running: false });
  }

  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const sec = parseInt(btn.getAttribute("data-preset") || "0", 10) || 0;
      setTime(sec);
    });
  });

  applyBtn?.addEventListener("click", () => {
    if (!customInput) return;
    const raw = customInput.value.trim();
    if (!raw) return;

    let sec = 0;
    if (raw.includes(":")) {
      const [m, s] = raw.split(":").map(v => parseInt(v, 10) || 0);
      sec = m * 60 + s;
    } else {
      sec = parseInt(raw, 10) || 0;
    }

    if (sec > 0) {
      setTime(sec);
    }
  });
}

