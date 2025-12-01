// modules/socketHandler.js

const SOCKET_URL = "https://scoreboard-server-er33.onrender.com";

let socket = null;
let currentMat = 1;
let lastState = null;
let stateCallback = null;

export function initSocket(onStateUpdate) {
  stateCallback = onStateUpdate;

  socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

  const connEl = document.getElementById("conn");

  socket.on("connect", () => {
    if (connEl) connEl.textContent = "connected";
    registerDevice();
    startHeartbeat();
  });

  socket.on("disconnect", () => {
    if (connEl) connEl.textContent = "disconnected";
  });

  socket.on("stateUpdate", (state) => {
    lastState = state;
    if (stateCallback) stateCallback(state);
  });
}

export function getCurrentMat() {
  return currentMat;
}

export function setCurrentMat(mat) {
  currentMat = mat;
  registerDevice();
  if (lastState && stateCallback) stateCallback(lastState);
}

function registerDevice() {
  if (!socket || !socket.connected) return;
  socket.emit("registerDevice", { type: "control", mat: currentMat });
}

function startHeartbeat() {
  setInterval(() => {
    if (!socket || !socket.connected) return;
    socket.emit("heartbeat", {
      type: "control",
      mat: currentMat,
      ts: Date.now()
    });
  }, 10000);
}

export function updateMatState(updates) {
  if (!socket) return;
  socket.emit("updateState", {
    mat: currentMat,
    updates
  });
}

export function addPoints(color, pts) {
  if (!socket) return;
  socket.emit("addPoints", {
    mat: currentMat,
    color,
    pts
  });
}

export function subPoint(color) {
  if (!socket) return;
  socket.emit("subPoint", {
    mat: currentMat,
    color
  });
}

export function resetMatOnServer() {
  if (!socket) return;
  socket.emit("resetMat", { mat: currentMat });
}

export function logMatchResult(entry) {
  if (!socket) return;
  socket.emit("matchEnded", entry);
}

export function getLastState() {
  return lastState;
}
