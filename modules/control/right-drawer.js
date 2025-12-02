
// =======================================================
// File: /modules/control/right-drawer.js
// Match Settings drawer: names + timeline visible in drawer.
// =======================================================

export function initRightDrawer(ctx) {
  const { getCurrentMat } = ctx;

  const openBtn = document.getElementById("openRight");
  const closeBtn = document.getElementById("closeRight");
  const drawer = document.getElementById("drawerRight");
  const backdrop = document.getElementById("drawerRightBackdrop");

  function open() {
    drawer?.classList.add("open");
    backdrop?.classList.add("open");
  }
  function close() {
    drawer?.classList.remove("open");
    backdrop?.classList.remove("open");
  }

  openBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  // For future: tie timeline to mat if desired.
  // Currently timelineBox content is not mat-specific; that can be expanded later.
  const timelineBox = document.getElementById("timelineBox");

  function appendTimeline(label) {
    if (!timelineBox) return;
    const div = document.createElement("div");
    div.className = "tl-item";
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    div.textContent = `[Mat ${getCurrentMat()} @ ${timeStr}] ${label}`;
    timelineBox.prepend(div);
  }

  // Expose hook for other modules (e.g. match-end, scoring)
  ctx.appendTimeline = appendTimeline;

  return { open, close, appendTimeline };
}
