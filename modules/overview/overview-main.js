<!-- ===========================
FILE: /modules/overview/overview-main.js
=========================== -->

import { initSocketClient } from "../core/socket.js";
import { initOverviewView, updateOverviewView } from "./overview-render.js";

const view = initOverviewView();
const connEl = document.getElementById("ov-conn");

function handleStateUpdate(state) {
  if (!state || !state.mats || !view) return;
  if (connEl) connEl.textContent = "connected";
  updateOverviewView(view, state.mats);
}

initSocketClient({
  role: "overview",
  mat: null,
  onState: handleStateUpdate
});
