// ================================================
// FILE: modules/scoreboard/scoreboard-render.js
// Renders the full-screen Scoreboard 3.2 UI
// ================================================

// ----------------------
// TIME FORMATTER
// ----------------------
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// ----------------------
// PERIOD FORMATTER
// ----------------------
function prettySegment(seg) {
  if (!seg) return "";

  if (seg.startsWith("REG")) return seg.replace("REG", "");
  if (seg.startsWith("OT")) return "OT";
  if (seg.startsWith("TB")) return seg.toUpperCase();
  if (seg.startsWith("UT")) return "UT";

  return seg;
}

// =================================================
// INIT VIEW
// =================================================
export function initScoreboardView() {
  const root = document.getElementById("scoreboard-root");
  if (!root) {
    console.error("[scoreboard-render] #scoreboard-root not found");
    return null;
  }

  root.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "sb-wrapper";

  // ----------------------
  // TOP ROW
  // ----------------------
  const topRow = document.createElement("div");
  topRow.className = "sb-top-row";

  const matBox = document.createElement("div");
  matBox.className = "sb-mat-box";
  const matLabel = document.createElement("div");
  matLabel.className = "sb-mat-label";
  matLabel.textContent = "MAT";
  const matValue = document.createElement("div");
  matValue.className = "sb-mat-value";
  matValue.textContent = "1";
  matBox.appendChild(matLabel);
  matBox.appendChild(matValue);

  const titleBox = document.createElement("div");
  titleBox.className = "sb-title-box";
  titleBox.textContent = "MATSIDE SCOREBOARD";

  const periodBox = document.createElement("div");
  periodBox.className = "sb-period-box";
  const periodLabel = document.createElement("div");
  periodLabel.className = "sb-period-label";
  periodLabel.textContent = "PERIOD";
  const periodValue = document.createElement("div");
  periodValue.className = "sb-period-value";
  periodValue.textContent = "1";
  periodBox.appendChild(periodLabel);
  periodBox.appendChild(periodValue);

  topRow.appendChild(matBox);
  topRow.appendChild(titleBox);
  topRow.appendChild(periodBox);

  // ----------------------
  // MID ROW
  // ----------------------
  const midRow = document.createElement("div");
  midRow.className = "sb-mid-row";

  const timeLabel = document.createElement("div");
  timeLabel.className = "sb-time-label";
  timeLabel.textContent = "TIME";

  const timeValue = document.createElement("div");
  timeValue.className = "sb-timer";
  timeValue.textContent = "01:00";

  midRow.appendChild(timeLabel);
  midRow.appendChild(timeValue);

  // ----------------------
  // BOTTOM ROW
  // ----------------------
  const bottomRow = document.createElement("div");
  bottomRow.className = "sb-bottom-row";

  const redBox = document.createElement("div");
  redBox.className = "sb-score-box sb-red";

  const redName = document.createElement("div");
  redName.className = "sb-name sb-name-red";
  redName.textContent = "RED WRESTLER";

  const redScore = document.createElement("div");
  redScore.className = "sb-score sb-score-red";
  redScore.textContent = "0";

  redBox.appendChild(redName);
  redBox.appendChild(redScore);

  const greenBox = document.createElement("div");
  greenBox.className = "sb-score-box sb-green";

  const greenName = document.createElement("div");
  greenName.className = "sb-name sb-name-green";
  greenName.textContent = "GREEN WRESTLER";

  const greenScore = document.createElement("div");
  greenScore.className = "sb-score sb-score-green";
  greenScore.textContent = "0";

  greenBox.appendChild(greenName);
  greenBox.appendChild(greenScore);

  bottomRow.appendChild(redBox);
  bottomRow.appendChild(greenBox);

  wrapper.appendChild(topRow);
  wrapper.appendChild(midRow);
  wrapper.appendChild(bottomRow);

  root.appendChild(wrapper);

  return {
    root,
    matEl: matValue,
    periodEl: periodValue,
    timeEl: timeValue,
    redScoreEl: redScore,
    greenScoreEl: greenScore,
    redNameEl: redName,
    greenNameEl: greenName
  };
}

// =================================================
// UPDATE VIEW
// =================================================
export function updateScoreboardView(view, matState, meta = {}) {
  if (!view || !matState) return;

  const {
    matEl,
    periodEl,
    timeEl,
    redScoreEl,
    greenScoreEl,
    redNameEl,
    greenNameEl
  } = view;

  const mat = meta.mat ?? 1;

  // 🟢 PERIOD FIX (new)
  const rawSegment = matState.segmentLabel || matState.segmentId || matState.period;
  const niceSegment = prettySegment(rawSegment);

  if (matEl) matEl.textContent = mat;
  if (periodEl) periodEl.textContent = niceSegment;
  if (timeEl) timeEl.textContent = formatTime(matState.time ?? 0);

  if (redScoreEl) redScoreEl.textContent = matState.red ?? 0;
  if (greenScoreEl) greenScoreEl.textContent = matState.green ?? 0;

  if (redNameEl) redNameEl.textContent = matState.redName || "RED WRESTLER";
  if (greenNameEl) greenNameEl.textContent = matState.greenName || "GREEN WRESTLER";
}
