// =============================================================
// Scoreboard Render Module (Dark UI Kit)
// Exports:
//   initScoreboardView() → creates DOM structure at #scoreboard-root
//   updateScoreboardView(view, matState, meta) → updates live values
// =============================================================

export function initScoreboardView() {
  const root = document.getElementById("scoreboard-root");
  root.innerHTML = "";

  // Main container
  const wrap = document.createElement("div");
  wrap.className = "sb-wrap";

  wrap.innerHTML = `
    <div class="sb-top">
      <div class="sb-block sb-left">
        <div class="sb-label">MAT</div>
        <div class="sb-value" id="sb-mat">1</div>
      </div>

      <div class="sb-block sb-center">
        <div class="sb-label">TIME</div>
        <div class="sb-value" id="sb-time">00:00</div>
      </div>

      <div class="sb-block sb-right">
        <div class="sb-label">PERIOD</div>
        <div class="sb-value" id="sb-period">1</div>
      </div>
    </div>

    <div class="sb-names">
      <div class="sb-name red" id="sb-red-name">RED WRESTLER</div>
      <div class="sb-name green" id="sb-green-name">GREEN WRESTLER</div>
    </div>

    <div class="sb-scores">
      <div class="sb-score red" id="sb-red-score">0</div>
      <div class="sb-score green" id="sb-green-score">0</div>
    </div>

    <div class="sb-footer">
      <div class="sb-winner" id="sb-winner"></div>
    </div>
  `;

  root.appendChild(wrap);

  return {
    root,
    matEl: wrap.querySelector("#sb-mat"),
    timeEl: wrap.querySelector("#sb-time"),
    periodEl: wrap.querySelector("#sb-period"),
    redNameEl: wrap.querySelector("#sb-red-name"),
    greenNameEl: wrap.querySelector("#sb-green-name"),
    redScoreEl: wrap.querySelector("#sb-red-score"),
    greenScoreEl: wrap.querySelector("#sb-green-score"),
    winnerEl: wrap.querySelector("#sb-winner"),
  };
}

export function updateScoreboardView(view, m, meta = {}) {
  if (!view || !m) return;

  const seg = m.segmentName || `P${m.period ?? 1}`;

  view.matEl.textContent = meta.mat ?? "1";
  view.periodEl.textContent = seg;
  view.timeEl.textContent = formatTime(m.time ?? 0);
  view.redScoreEl.textContent = m.red ?? 0;
  view.greenScoreEl.textContent = m.green ?? 0;

  // Names (if provided by control panel)
  if (m.redName) view.redNameEl.textContent = m.redName;
  if (m.greenName) view.greenNameEl.textContent = m.greenName;

  // Winner display
  if (meta.winner && meta.winner !== "none") {
    view.winnerEl.textContent =
      meta.winner === "red" ? "RED WINS" : "GREEN WINS";
    view.winnerEl.style.display = "block";
  } else {
    view.winnerEl.style.display = "none";
  }
}

// Helper
function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
