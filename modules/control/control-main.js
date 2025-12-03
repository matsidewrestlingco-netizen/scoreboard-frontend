// =======================================================
// File: /modules/control/control-main.js
// Fully updated for v2.20 modular architecture
// Uses universal segmentLabel module
// =======================================================

import { segmentLabel } from "../core/period-name.js";

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
  const sumSegEl = document.getElementById("sumSeg");
  const sumTimeEl = document.getElementById("sumTime");
  const sumRedEl = document.getElementById("sumRed");
  const sumGreenEl = document.getElementById("sumGreen");

  let currentMat = parseInt(matSelect?.value || "1", 10);
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

  // -------------------------------------------------------
  // Render Summary (Top Bar)
  // -------------------------------------------------------
  function renderSummary() {
    const m = getMatState();
    if (!m) return;

    sumMatEl.textContent = String(currentMat);
    sumSegEl.textContent = prettySegment(m.segmentId);
    sumTimeEl.textContent = formatTime(m.time ?? 0);
    sumRedEl.textContent = String(m.red ?? 0);
    sumGreenEl.textContent = String(m.green ?? 0);
  }

  // -------------------------------------------------------
  // Socket.io wiring
  // -------------------------------------------------------
  socket.on("connect", () => {
    connEl.textContent = "connected";
  });

  socket.on("disconnect", () => {
    connEl.textContent = "disconnected";
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

  // -------------------------------------------------------
  // Mat selector
  // -------------------------------------------------------
  matSelect.addEventListener("change", () => {
    currentMat = parseInt(matSelect.value || "1", 10);
    renderSummary();
  });

  // -------------------------------------------------------
  // Timer controls
  // -------------------------------------------------------
  document.getElementById("startBtn").addEventListener("click", () => {
    updateState(getCurrentMat(), { running: true });
  });

  document.getElementById("stopBtn").addEventListener("click", () => {
    updateState(getCurrentMat(), { running: false });
  });

  document.getElementById("resetTimerBtn").addEventListener("click", () => {
    const m = getMatState();
    const resetTime = m?.segmentDefaultTime ?? 60;
    updateState(getCurrentMat(), { running: false, time: resetTime });
  });

  // -------------------------------------------------------
  // Scoring buttons
  // -------------------------------------------------------
  document.querySelectorAll("[data-color][data-pts]").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      const pts = parseInt(btn.getAttribute("data-pts"));

      socket.emit("addPoints", {
        mat: getCurrentMat(),
        color,
        pts
      });
    });
  });

  document.getElementById("subRed")?.addEventListener("click", () => {
    socket.emit("subPoint", { mat: getCurrentMat(), color: "red" });
  });

  document.getElementById("subGreen")?.addEventListener("click", () => {
    socket.emit("subPoint", { mat: getCurrentMat(), color: "green" });
  });

  document.getElementById("resetScores")?.addEventListener("click", () => {
    updateState(getCurrentMat(), { red: 0, green: 0 });
  });

  // -------------------------------------------------------
  // Create context object for other modules
  // -------------------------------------------------------
  const ctx = {
    socket,
    getCurrentMat,
    getMatState,
    updateState,
    formatTime
  };

  // -------------------------------------------------------
  // Initialize optional modules (plug-ins)
  // -------------------------------------------------------
  if (modules.matchEnd) modules.matchEnd(ctx);
  if (modules.resetMat) modules.resetMat(ctx);
  if (modules.rightDrawer) modules.rightDrawer(ctx);
  if (modules.timeDrawer) modules.timeDrawer(ctx);
  if (modules.names) modules.names(ctx);
  if (modules.heartbeat) modules.heartbeat(ctx);
  if (modules.diagnostics) modules.diagnostics(ctx);

  return ctx;
}
