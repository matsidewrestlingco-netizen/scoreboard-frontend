/* ================================================
   Overview Renderer — 4 mini scoreboards (auto-scale)
   ================================================ */

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function prettySegment(seg) {
  if (!seg) return "";
  if (seg.startsWith("REG")) return seg.replace("REG", "");
  if (seg.startsWith("OT")) return "OT";
  if (seg.startsWith("TB")) return seg.toUpperCase();
  if (seg.startsWith("UT")) return "UT";
  return seg;
}

/**
 * Build a 2x2 responsive grid of "mini scoreboards".
 * Returns a view object with references per-mat.
 */
export function initOverviewView() {
  const root = document.getElementById("overview-root");
  if (!root) {
    console.error("[overview-render] #overview-root not found");
    return null;
  }

  root.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "ov-wrapper";

  const grid = document.createElement("div");
  grid.className = "ov-grid";

  const mats = {};

  for (let m = 1; m <= 4; m += 1) {
    const card = document.createElement("div");
    card.className = "ov-card";

    // TOP ROW
    const topRow = document.createElement("div");
    topRow.className = "ov-top-row";

    const matBox = document.createElement("div");
    matBox.className = "ov-mat-box";
    const matLabel = document.createElement("div");
    matLabel.className = "ov-mat-label";
    matLabel.textContent = "MAT";
    const matValue = document.createElement("div");
    matValue.className = "ov-mat-value";
    matValue.textContent = String(m);
    matBox.appendChild(matLabel);
    matBox.appendChild(matValue);

    const titleBox = document.createElement("div");
    titleBox.className = "ov-title-box";
    titleBox.textContent = "MATSIDE";

    const periodBox = document.createElement("div");
    periodBox.className = "ov-period-box";
    const periodLabel = document.createElement("div");
    periodLabel.className = "ov-period-label";
    periodLabel.textContent = "PERIOD";
    const periodValue = document.createElement("div");
    periodValue.className = "ov-period-value";
    periodValue.textContent = "1";
    periodBox.appendChild(periodLabel);
    periodBox.appendChild(periodValue);

    topRow.appendChild(matBox);
    topRow.appendChild(titleBox);
    topRow.appendChild(periodBox);

    // MID ROW (TIME)
    const midRow = document.createElement("div");
    midRow.className = "ov-mid-row";

    const timeLabel = document.createElement("div");
    timeLabel.className = "ov-time-label";
    timeLabel.textContent = "TIME";

    const timeValue = document.createElement("div");
    timeValue.className = "ov-timer";
    timeValue.textContent = "01:00";

    midRow.appendChild(timeLabel);
    midRow.appendChild(timeValue);

    // BOTTOM ROW (RED / GREEN)
    const bottomRow = document.createElement("div");
    bottomRow.className = "ov-bottom-row";

    const redBox = document.createElement("div");
    redBox.className = "ov-score-box ov-red";
    const redName = document.createElement("div");
    redName.className = "ov-name ov-name-red";
    redName.textContent = "RED";
    const redScore = document.createElement("div");
    redScore.className = "ov-score ov-score-red";
    redScore.textContent = "0";
    redBox.appendChild(redName);
    redBox.appendChild(redScore);

    const greenBox = document.createElement("div");
    greenBox.className = "ov-score-box ov-green";
    const greenName = document.createElement("div");
    greenName.className = "ov-name ov-name-green";
    greenName.textContent = "GREEN";
    const greenScore = document.createElement("div");
    greenScore.className = "ov-score ov-score-green";
    greenScore.textContent = "0";
    greenBox.appendChild(greenName);
    greenBox.appendChild(greenScore);

    bottomRow.appendChild(redBox);
    bottomRow.appendChild(greenBox);

    // Compose card
    card.appendChild(topRow);
    card.appendChild(midRow);
    card.appendChild(bottomRow);
    grid.appendChild(card);

    mats[m] = {
      card,
      matValue,
      periodValue,
      timeValue,
      redName,
      greenName,
      redScore,
      greenScore
    };
  }

  wrapper.appendChild(grid);
  root.appendChild(wrapper);

  return { root, mats };
}

/**
 * Update 4 mat cards from matsState.
 */
export function updateOverviewView(view, matsState = {}) {
  if (!view || !view.mats) return;

  for (let m = 1; m <= 4; m += 1) {
    const cardRefs = view.mats[m];
    const s = matsState[m];

    if (!cardRefs || !s) continue;

    const seg = s.segmentLabel || s.segmentId || s.period;
    const niceSegment = prettySegment(seg);

    cardRefs.matValue.textContent = String(m);
    cardRefs.periodValue.textContent = niceSegment;
    cardRefs.timeValue.textContent = formatTime(s.time ?? 0);
    cardRefs.redName.textContent = s.redName || "RED";
    cardRefs.greenName.textContent = s.greenName || "GREEN";
    cardRefs.redScore.textContent = s.red ?? 0;
    cardRefs.greenScore.textContent = s.green ?? 0;
  }
}
