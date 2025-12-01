// modules/scoreboard-render.js
// Responsible for: DOM layout + visual updates

export function createScoreboardRenderer(root) {
  // Build DOM once
  root.innerHTML = `
    <div class="sb-top-row">
      <div class="sb-chip">
        <div class="sb-chip-label">Mat</div>
        <div class="sb-chip-value" id="sb-mat">1</div>
      </div>
      <div class="sb-chip sb-chip-timer" id="sb-timer-shell">
        <div class="sb-chip-label">Time</div>
        <div class="sb-chip-value" id="sb-time">00:00</div>
      </div>
      <div class="sb-chip">
        <div class="sb-chip-label">Period</div>
        <div class="sb-chip-value" id="sb-period">1</div>
      </div>
    </div>

    <div class="sb-main-row">
      <div class="sb-side sb-side-red">
        <div class="sb-side-header">
          <div class="sb-side-name" id="sb-red-name">RED WRESTLER</div>
          <div class="sb-side-tag">Home</div>
        </div>
        <div class="sb-score-box" id="sb-red-score">0</div>
      </div>

      <div class="sb-side sb-side-green">
        <div class="sb-side-header">
          <div class="sb-side-name" id="sb-green-name">GREEN WRESTLER</div>
          <div class="sb-side-tag">Visitor</div>
        </div>
        <div class="sb-score-box" id="sb-green-score">0</div>
      </div>
    </div>

    <div class="sb-winner-banner" id="sb-winner-banner"></div>

    <div class="sb-watermark">Matside • Live Scoreboard</div>
  `;

  const matEl         = root.querySelector("#sb-mat");
  const periodEl      = root.querySelector("#sb-period");
  const timeEl        = root.querySelector("#sb-time");
  const timerShellEl  = root.querySelector("#sb-timer-shell");
  const redNameEl     = root.querySelector("#sb-red-name");
  const greenNameEl   = root.querySelector("#sb-green-name");
  const redScoreEl    = root.querySelector("#sb-red-score");
  const greenScoreEl  = root.querySelector("#sb-green-score");
  const winnerBanner  = root.querySelector("#sb-winner-banner");

  let lastRed = 0;
  let lastGreen = 0;

  return function render(vm) {
    if (!vm) return;

    if (matEl) matEl.textContent = vm.mat;
    if (periodEl) periodEl.textContent = vm.periodLabel;
    if (timeEl) timeEl.textContent = vm.timeLabel;
    if (redNameEl) redNameEl.textContent = vm.redName;
    if (greenNameEl) greenNameEl.textContent = vm.greenName;

    if (redScoreEl) {
      if (vm.redScore !== lastRed) {
        redScoreEl.textContent = vm.redScore;
        redScoreEl.classList.add("bump");
        setTimeout(() => redScoreEl.classList.remove("bump"), 120);
        lastRed = vm.redScore;
      } else {
        redScoreEl.textContent = vm.redScore;
      }
    }

    if (greenScoreEl) {
      if (vm.greenScore !== lastGreen) {
        greenScoreEl.textContent = vm.greenScore;
        greenScoreEl.classList.add("bump");
        setTimeout(() => greenScoreEl.classList.remove("bump"), 120);
        lastGreen = vm.greenScore;
      } else {
        greenScoreEl.textContent = vm.greenScore;
      }
    }

    // Timer flash at 0
    if (timerShellEl) {
      if (vm.rawTime === 0) {
        timerShellEl.classList.add("flash");
      } else {
        timerShellEl.classList.remove("flash");
      }
    }

    // Winner banner
    if (!winnerBanner) return;

    winnerBanner.style.display = "none";
    winnerBanner.classList.remove("sb-winner-red","sb-winner-green");

    if (!vm.winner) return;

    if (vm.winner === "red") {
      winnerBanner.textContent = "WINNER — RED";
      winnerBanner.classList.add("sb-winner-red");
      winnerBanner.style.display = "block";
    } else if (vm.winner === "green") {
      winnerBanner.textContent = "WINNER — GREEN";
      winnerBanner.classList.add("sb-winner-green");
      winnerBanner.style.display = "block";
    }
  };
}
