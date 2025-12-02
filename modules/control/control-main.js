// =======================================================
// File: /modules/control/control-main.js
// Master orchestrator for the control panel (future use).
// NOTE: This does NOT auto-run. Call initControlMain() from control.html.
// =======================================================

export function initControlMain({
  serverUrl,
  onStateUpdate,
  modules = {}
}) {
  // Expect global io from socket.io script
  const socket = io(serverUrl, { transports: ["websocket"] });

  const matSelect = document.getElementById("matSelect");
  const connEl = document.getElementById("conn");
  const sumMatEl = document.getElementById("sumMat");
  const sumSegEl = document.getElementById("sumSeg") || null;
  const sumTimeEl = document.getElementById("sumTime");
  const sumRedEl = document.getElementById("sumRed");
  const sumGreenEl = document.getElementById("sumGreen");

  let currentMat = parseInt(matSelect?.value || "1", 10) || 1;
  let mats = {}; // server truth

  function getCurrentMat() {
    return currentMat;
  }

  function getMatState(matId = currentMat) {
    return mats[matId] || null;
  }

  function updateState(mat, updates) {
    socket.emit("updateState", { mat, updates });
  }

  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function renderSummary() {
    const m = getMatState();
    if (!m) return;

    if (sumMatEl) sumMatEl.textContent = String(currentMat);
    if (sumSegEl) sumSegEl.textContent = m.segmentId || `P${m.period || 1}`;
    if (sumTimeEl) sumTimeEl.textContent = formatTime(m.time ?? 0);
    if (sumRedEl) sumRedEl.textContent = String(m.red ?? 0);
    if (sumGreenEl) sumGreenEl.textContent = String(m.green ?? 0);
  }

  // Socket wiring
  socket.on("connect", () => {
    if (connEl) connEl.textContent = "connected";
  });

  socket.on("disconnect", () => {
    if (connEl) connEl.textContent = "disconnected";
  });

  socket.on("stateUpdate", payload => {
    if (payload && payload.mats) {
      mats = payload.mats;
      renderSummary();
      if (typeof onStateUpdate === "function") {
        onStateUpdate({ mats, currentMat });
      }
    }
  });

  // Mat selector
  if (matSelect) {
    matSelect.addEventListener("change", () => {
      currentMat = parseInt(matSelect.value || "1", 10) || 1;
      renderSummary();
    });
  }

  // Hook timer buttons (simple emit-only; server keeps truth)
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");

  startBtn?.addEventListener("click", () => {
    updateState(getCurrentMat(), { running: true });
  });

  stopBtn?.addEventListener("click", () => {
    updateState(getCurrentMat(), { running: false });
  });

  resetTimerBtn?.addEventListener("click", () => {
    const m = getMatState();
    const resetTime = m?.segmentDefaultTime ?? 60;
    updateState(getCurrentMat(), { running: false, time: resetTime });
  });

  // Scoring buttons
  document.querySelectorAll("[data-color][data-pts]").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      const pts = parseInt(btn.getAttribute("data-pts") || "0", 10) || 0;
      if (!color || !pts) return;
      socket.emit("addPoints", {
        mat: getCurrentMat(),
        color,
        pts
      });
    });
  });

  const subRed = document.getElementById("subRed");
  const subGreen = document.getElementById("subGreen");
  const resetScores = document.getElementById("resetScores");

  subRed?.addEventListener("click", () => {
    socket.emit("subPoint", { mat: getCurrentMat(), color: "red" });
  });
  subGreen?.addEventListener("click", () => {
    socket.emit("subPoint", { mat: getCurrentMat(), color: "green" });
  });
  resetScores?.addEventListener("click", () => {
    updateState(getCurrentMat(), { red: 0, green: 0 });
  });

  // Context object for other modules
  const ctx = {
    socket,
    getCurrentMat,
    getMatState,
    updateState,
    formatTime,
  };

  // Initialize optional modules if provided
  if (modules.matchEnd) modules.matchEnd(ctx);
  if (modules.resetMat) modules.resetMat(ctx);
  if (modules.rightDrawer) modules.rightDrawer(ctx);
  if (modules.timeDrawer) modules.timeDrawer(ctx);
  if (modules.names) modules.names(ctx);
  if (modules.heartbeat) modules.heartbeat(ctx);
  if (modules.diagnostics) modules.diagnostics(ctx);

  return ctx;
}


