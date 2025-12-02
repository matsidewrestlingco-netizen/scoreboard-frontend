// modules/ui/drawers.js
// -------------------------------------------------------
// Generic drawer toggle system
// -------------------------------------------------------

export function initDrawers() {
  const left = document.getElementById("drawerLeft");
  const right = document.getElementById("drawerRight");

  const leftBackdrop = document.getElementById("drawerLeftBackdrop");
  const rightBackdrop = document.getElementById("drawerRightBackdrop");

  document.getElementById("openLeft")?.addEventListener("click", () => {
    left.classList.add("open");
    leftBackdrop.classList.add("open");
  });

  document.getElementById("openRight")?.addEventListener("click", () => {
    right.classList.add("open");
    rightBackdrop.classList.add("open");
  });

  document.getElementById("closeLeft")?.addEventListener("click", () => {
    left.classList.remove("open");
    leftBackdrop.classList.remove("open");
  });

  document.getElementById("closeRight")?.addEventListener("click", () => {
    right.classList.remove("open");
    rightBackdrop.classList.remove("open");
  });

  leftBackdrop?.addEventListener("click", () => {
    left.classList.remove("open");
    leftBackdrop.classList.remove("open");
  });

  rightBackdrop?.addEventListener("click", () => {
    right.classList.remove("open");
    rightBackdrop.classList.remove("open");
  });
}
