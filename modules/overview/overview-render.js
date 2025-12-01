// =========================================================
// FILE: modules/overview/overview-render.js
// DOM wiring + updates for 4-mat overview
// =========================================================
import { formatTime } from "../shared/helpers.js";
import { segmentLabelToDisplay } from "../core/period-name.js";
import { computeWinnerForView } from "../core/segment-engine.js";

export function initOverviewView() {
  const cards = Array.from(document.querySelectorAll(".ms-mat-card[data-mat]"));
  const view = {};

  cards.forEach((card) => {
    const mat = parseInt(card.getAttribute("data-mat"), 10);
    if (!Number.isFinite(mat)) return;

    view[mat] = {
      card,
      periodEl: card.querySelector(".ov-period"),
      timeEl: card.querySelector(".ov-time"),
      redScoreEl: card.querySelector(".ov-red-score"),
      greenScoreEl: card.querySelector(".ov-green-score"),
      runningEl: card.querySelector(".ov-running"),
      winnerEl: card.querySelector(".ov-winner")
    };
  });

  return view;
}

export function updateOverviewView(view, matsState) {
  if (!view || !matsState) return;

  for (let mat = 1; mat <= 4; mat += 1) {
    const mView = view[mat];
    const m = matsState[mat];
    if (!mView || !m) continue;

    const segId = m.segmentId || "REG1";
    const time = m.time ?? 0;
    const red = m.red ?? 0;
    const green = m.green ?? 0;

    if (mView.periodEl) mView.periodEl.textContent = segmentLabelToDisplay(segId);
    if (mView.timeEl) mView.timeEl.textContent = formatTime(time);
    if (mView.redScoreEl) mView.redScoreEl.textContent = red;
    if (mView.greenScoreEl) mView.greenScoreEl.textContent = green;
    if (mView.runningEl) mView.runningEl.textContent = m.running ? "Yes" : "No";

    const winner = computeWinnerForView(m);
    resetWinnerLabel(mView);

    if (!winner) {
      if (mView.winnerEl) mView.winnerEl.textContent = "–";
      continue;
    }

    if (winner === "red") {
      if (mView.winnerEl) {
        mView.winnerEl.textContent = "RED";
        mView.winnerEl.classList.add("ms-winner-red");
      }
    } else if (winner === "green") {
      if (mView.winnerEl) {
        mView.winnerEl.textContent = "GREEN";
        mView.winnerEl.classList.add("ms-winner-green");
      }
    }
  }
}

function resetWinnerLabel(mView) {
  if (!mView.winnerEl) return;
  mView.winnerEl.classList.remove("ms-winner-red", "ms-winner-green");
}
