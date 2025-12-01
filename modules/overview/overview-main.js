// =========================================================
// FILE: modules/overview/overview-main.js
// Wire socket -> state -> render for 4-mat overview
// =========================================================
import { initSocketClient } from "../core/socket.js";
import { initOverviewView, updateOverviewView } from "./overview-render.js";

const connEl = document.getElementById("ov-conn");
const view = initOverviewView();

function handleStateUpdate(state) {
  if (!state || !state.mats) return;
  updateOverviewView(view, state.mats);
}

initSocketClient({
  role: "overview",
  mat: null,
  onState: (state) => {
    if (connEl) connEl.textContent = "connected";
    handleStateUpdate(state);
  }
});

// No explicit disconnect hook; Socket.IO will update if needed
