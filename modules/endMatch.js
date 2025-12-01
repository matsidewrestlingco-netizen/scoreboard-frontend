// modules/endMatch.js
import { getCurrentMat, getLastState, logMatchResult } from "./socketHandler.js";
import { showToast } from "./toasts.js";
import { addTimelineEntry } from "./timeline.js";
import { resetMatOnServer } from "./socketHandler.js";

let overlay;
let winnerButtons = [];
let resultButtons = [];
let cancelBtn, submitBtn;

let selectedWinner = null;
let selectedResult = null;

export function initEndMatch() {
  overlay = document.getElementById("endMatchOverlay");
  cancelBtn = document.getElementById("cancelEndMatch");
  submitBtn = document.getElementById("submitEndMatch");

  winnerButtons = Array.from(document.querySelectorAll(".pill-btn[data-winner]"));
  resultButtons = Array.from(document.querySelectorAll(".pill-btn[data-result]"));

  const endMatchBtn = document.getElementById("endMatchBtn");
  if (endMatchBtn) endMatchBtn.onclick = openOverlay;

  winnerButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedWinner = btn.dataset.winner;
      winnerButtons.forEach(b => b.classList.toggle("selected", b === btn));
    });
  });

  resultButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedResult = btn.dataset.result;
      resultButtons.forEach(b => b.classList.toggle("selected", b === btn));
    });
  });

  if (cancelBtn) cancelBtn.onclick = closeOverlay;
  if (submitBtn) submitBtn.onclick = submitMatch;
}

function openOverlay() {
  selectedWinner = null;
  selectedResult = null;
  winnerButtons.forEach(b => b.classList.remove("selected"));
  resultButtons.forEach(b => b.classList.remove("selected"));
  if (overlay) overlay.classList.add("show");
}

function closeOverlay() {
  if (overlay) overlay.classList.remove("show");
}

function submitMatch() {
  const state = getLastState();
  const mat = getCurrentMat();
  if (!state || !state.mats || !state.mats[mat]) {
    showToast("No state for mat", true);
    return;
  }
  const m = state.mats[mat];

  if (!selectedWinner) {
    if ((m.red ?? 0) > (m.green ?? 0)) selectedWinner = "red";
    else if ((m.green ?? 0) > (m.red ?? 0)) selectedWinner = "green";
  }

  if (!selectedWinner || !selectedResult) {
    showToast("Select winner and result", true);
    return;
  }

  const entry = {
    mat,
    segmentId: m.segmentId || "REG1",
    timeLeft: m.time ?? 0,
    redScore: m.red ?? 0,
    greenScore: m.green ?? 0,
    winner: selectedWinner,
    result: selectedResult,
    timestamp: Date.now()
  };

  logMatchResult(entry);
  addTimelineEntry({
    type: "match-end",
    label: `${selectedWinner.toUpperCase()} via ${selectedResult}`
  });
  showToast("Match submitted");
  closeOverlay();
  resetMatOnServer();
}
