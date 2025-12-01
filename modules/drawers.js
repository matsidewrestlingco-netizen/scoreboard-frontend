// modules/drawers.js
import { resetMatOnServer } from "./socketHandler.js";
import { clearTimeline } from "./timeline.js";
import { showToast } from "./toasts.js";

let drawerLeft, drawerRight, backdropLeft, backdropRight;
let openLeftBtn, closeLeftBtn, openRightBtn, closeRightBtn;
let redNameInput, greenNameInput, resetMatBtn;

export function initDrawers() {
  drawerLeft = document.getElementById("drawerLeft");
  drawerRight = document.getElementById("drawerRight");
  backdropLeft = document.getElementById("backdropLeft");
  backdropRight = document.getElementById("backdropRight");
  openLeftBtn = document.getElementById("openDrawerLeft");
  closeLeftBtn = document.getElementById("closeDrawerLeft");
  openRightBtn = document.getElementById("openDrawerRight");
  closeRightBtn = document.getElementById("closeDrawerRight");

  redNameInput = document.getElementById("redNameInput");
  greenNameInput = document.getElementById("greenNameInput");
  resetMatBtn = document.getElementById("resetMatBtn");

  if (openLeftBtn) openLeftBtn.onclick = () => openDrawer("left");
  if (closeLeftBtn) closeLeftBtn.onclick = () => closeDrawer("left");
  if (backdropLeft) backdropLeft.onclick = () => closeDrawer("left");

  if (openRightBtn) openRightBtn.onclick = () => openDrawer("right");
  if (closeRightBtn) closeRightBtn.onclick = () => closeDrawer("right");
  if (backdropRight) backdropRight.onclick = () => closeDrawer("right");

  if (resetMatBtn) {
    resetMatBtn.onclick = () => {
      const ok = confirm("Reset entire mat? Time, period, scores, names, and timeline will be cleared.");
      if (!ok) return;
      if (redNameInput) redNameInput.value = "";
      if (greenNameInput) greenNameInput.value = "";
      clearTimeline();
      resetMatOnServer();
      showToast("Mat reset");
    };
  }
}

function openDrawer(which) {
  if (which === "left") {
    drawerLeft && drawerLeft.classList.add("open");
    backdropLeft && backdropLeft.classList.add("open");
  } else {
    drawerRight && drawerRight.classList.add("open");
    backdropRight && backdropRight.classList.add("open");
  }
}

function closeDrawer(which) {
  if (which === "left") {
    drawerLeft && drawerLeft.classList.remove("open");
    backdropLeft && backdropLeft.classList.remove("open");
  } else {
    drawerRight && drawerRight.classList.remove("open");
    backdropRight && backdropRight.classList.remove("open");
  }
}
