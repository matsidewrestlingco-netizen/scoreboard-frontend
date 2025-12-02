// ================================================
// FILE: modules/overview/overview-render.js
// Renders 4-mat Overview 3.2 UI
// ================================================

function formatTimeOv(seconds) {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/**
 * Build overview layout for 4 mats, return refs per mat.
 */
export function initOverviewView() {
  const root = document.getElementById("overview-root");
  if (!root) {
    console.error("[overview-render] #overview-root not found");
    return null;
  }

  root.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "ov-wrapper";

  const grid = document.createElement("div");
  grid.className = "ov-grid";

  const mats = {};

  for (let m = 1; m <= 4; m += 1) {
    const card = document.createElement("div");
    card.className = "ov-card";

    const top = document.createElement("div");
    top.className = "ov-card-top";

    const matLabel = document.createElement("div");
    matLabel.className = "ov-mat-label";
    matLabel.textContent = `MAT ${m}`;

    const periodEl = document.createElement("div");
    periodEl.className = "ov-period";
    periodEl.textContent = "1";

    const timeEl = document.createElement("div");
    timeEl.className = "ov-time";
    timeEl.textContent = "01:00";

    top.appendChild(matLabel);
    top.appendChild(periodEl);
    top.appendChild(timeEl);

    const mid = document.createElement("div");
    mid.className = "ov-card-mid";

    const redName = document.createElement("div");
    redName.className = "ov-name ov-name-red";
    redName.textContent = "RED";

    const greenName = document.createElement("div");
    greenName.className = "ov-name ov-name-green";
    greenName.textContent = "GREEN";

    mid.appendChild(redName);
    mid.appendChild(greenName);

    const bottom = document.createElement("div");
    bottom.className = "ov-card-bottom";

    const redScore = document.createElement("div");
    redScore.className = "ov-score ov-score-red";
    redScore.textContent = "0";

    const greenScore = document.createElement("div");
    greenScore.className = "ov-score ov-score-green";
    greenScore.textContent = "0";

    bottom.appendChild(redScore);
    bottom.appendChild(greenScore);

    card.appendChild(top);
    card.appendChild(mid);
    card.appendChild(bottom);
    grid.appendChild(card);

    mats[m] = {
      card,
      periodEl,
      timeEl,
      redName,
      greenName,
      redScore,
      greenScore
    };
  }

  wrap.appendChild(grid);
  root.appendChild(wrap);

  return { root, mats };
}

/**
 * Update all 4 mats in overview.
 */
export function updateOverviewView(view, matsState = {}) {
  if (!view || !view.mats) return;

  for (let m = 1; m <= 4; m += 1) {
    const v = view.mats[m];
    const s = matsState[m];
    if (!v || !s) continue;

    const period = s.segmentLabel || s.segmentId || s.period || 1;
    const time = s.time ?? 0;

    v.periodEl.textContent = period;
    v.timeEl.textContent = formatTimeOv(time);

    v.redName.textContent = s.redName || "RED";
    v.greenName.textContent = s.greenName || "GREEN";
    v.redScore.textContent = s.red ?? 0;
    v.greenScore.textContent = s.green ?? 0;
  }
}
