// =======================================================
// FILE: modules/control/match-end.js
// Clean, self-contained modal for ending a match
// No dependencies on HTML elements being pre-existing.
// =======================================================

export function matchEnd(ctx) {
  const { getMatState, getCurrentMat, socket } = ctx;

  // Create modal container once
  let modal = document.createElement("div");
  modal.id = "matchEndModal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.65)";
  modal.style.display = "none";
  modal.style.zIndex = "99999";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.fontFamily = "system-ui, sans-serif";

  modal.innerHTML = `
    <div style="
      background:#111;
      padding:20px;
      width:90%;
      max-width:360px;
      border-radius:12px;
      color:#fff;
      box-shadow:0 0 25px rgba(0,0,0,0.5);
    ">
      <h2 style="margin-top:0;font-size:20px;text-align:center;">
        Finalize Match
      </h2>

      <div id="endMatchSummary" style="
        text-align:center;
        font-size:15px;
        margin-bottom:12px;
        opacity:0.85;
      ">
        —
      </div>

      <div style="font-size:14px;margin-bottom:6px;">Select Winner:</div>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button id="winnerRedBtn" style="
          flex:1;background:#c62828;color:#fff;
          padding:10px;border:0;border-radius:8px;
          font-weight:600;cursor:pointer;
        ">Red</button>

        <button id="winnerGreenBtn" style="
          flex:1;background:#2e7d32;color:#fff;
          padding:10px;border:0;border-radius:8px;
          font-weight:600;cursor:pointer;
        ">Green</button>
      </div>

      <div style="font-size:14px;margin-bottom:6px;">Victory Method:</div>
      <div style="
        display:flex;flex-wrap:wrap;gap:8px;
        margin-bottom:14px;
      ">
        <button class="methodBtn" data-method="Decision"
          style="flex:1;border:0;border-radius:8px;padding:10px;
          background:#424242;color:#fff;cursor:pointer;">Decision</button>

        <button class="methodBtn" data-method="Tech Fall"
          style="flex:1;border:0;border-radius:8px;padding:10px;
          background:#424242;color:#fff;cursor:pointer;">Tech Fall</button>

        <button class="methodBtn" data-method="Pin"
          style="flex:1;border:0;border-radius:8px;padding:10px;
          background:#424242;color:#fff;cursor:pointer;">Pin</button>

        <button class="methodBtn" data-method="Forfeit"
          style="flex:1;border:0;border-radius:8px;padding:10px;
          background:#424242;color:#fff;cursor:pointer;">Forfeit</button>
      </div>

      <button id="endMatchSubmit" style="
        width:100%;padding:12px;border:0;border-radius:8px;
        background:#1e88e5;color:#fff;font-weight:700;
        cursor:pointer;margin-bottom:10px;
      ">Submit</button>

      <button id="endMatchCancel" style="
        width:100%;padding:10px;border:0;border-radius:8px;
        background:#555;color:#fff;cursor:pointer;
      ">Cancel</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Elements inside modal
  const summaryEl = modal.querySelector("#endMatchSummary");
  const winnerRedBtn = modal.querySelector("#winnerRedBtn");
  const winnerGreenBtn = modal.querySelector("#winnerGreenBtn");
  const submitBtn = modal.querySelector("#endMatchSubmit");
  const cancelBtn = modal.querySelector("#endMatchCancel");

  let selectedWinner = null;
  let selectedMethod = null;

  // Winner selection
  winnerRedBtn.onclick = () => {
    selectedWinner = "red";
    winnerRedBtn.style.opacity = "1";
    winnerGreenBtn.style.opacity = "0.5";
  };
  winnerGreenBtn.onclick = () => {
    selectedWinner = "green";
    winnerGreenBtn.style.opacity = "1";
    winnerRedBtn.style.opacity = "0.5";
  };

  // Method buttons
  modal.querySelectorAll(".methodBtn").forEach(btn => {
    btn.onclick = () => {
      selectedMethod = btn.dataset.method;
      modal.querySelectorAll(".methodBtn").forEach(b => {
        b.style.opacity = b === btn ? "1" : "0.45";
      });
    };
  });

  // Cancel
  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  // Submit
  submitBtn.onclick = async () => {
    if (!selectedWinner || !selectedMethod) {
      alert("Please select a winner and victory method.");
      return;
    }

    const mat = getCurrentMat();
    const state = getMatState(mat);

    const result = {
      mat,
      winner: selectedWinner,
      method: selectedMethod,
      redScore: state.red,
      greenScore: state.green,
      segmentId: state.segmentId,
      timestamp: Date.now()
    };

    // Send to server
    fetch("https://scoreboard-server-er33.onrender.com/save-match-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });

    // Reset mat via socket
    socket.emit("updateState", {
      mat,
      updates: {
        red: 0,
        green: 0,
        running: false,
        time: 60,
        segmentId: "REG1",
        period: 1
      }
    });

    modal.style.display = "none";
  };

  // Main button = open modal
  const btn = document.getElementById("endMatchBtn");
  if (btn) {
    btn.onclick = () => {
      const m = getMatState(getCurrentMat());
      summaryEl.textContent = `Red ${m.red} — ${m.green} Green`;

      // auto-suggest winner
      if (m.red > m.green) {
        winnerRedBtn.style.opacity = "1";
        winnerGreenBtn.style.opacity = "0.5";
        selectedWinner = "red";
      } else if (m.green > m.red) {
        winnerGreenBtn.style.opacity = "1";
        winnerRedBtn.style.opacity = "0.5";
        selectedWinner = "green";
      } else {
        winnerGreenBtn.style.opacity = "1";
        winnerRedBtn.style.opacity = "1";
        selectedWinner = null;
      }

      // reset method
      selectedMethod = null;
      modal.querySelectorAll(".methodBtn").forEach(b => b.style.opacity = "1");

      modal.style.display = "flex";
    };
  }
}
