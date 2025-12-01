// =========================================================
// FILE: modules/core/socket.js
// Shared Socket.IO client helper for scoreboard & overview
// =========================================================
const SOCKET_URL = "https://scoreboard-server-er33.onrender.com";

export function getSocketUrl() {
  return SOCKET_URL;
}

export function initSocketClient({ role, mat = null, onState }) {
  const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

  socket.on("connect", () => {
    socket.emit("registerDevice", {
      type: role,
      mat: mat || null
    });
  });

  socket.on("stateUpdate", (state) => {
    if (typeof onState === "function") {
      onState(state);
    }
  });

  // lightweight heartbeat so server monitor can see clients
  setInterval(() => {
    if (!socket.connected) return;
    socket.emit("heartbeat", {
      type: role,
      mat: mat || null,
      ts: Date.now()
    });
  }, 10000);

  return socket;
}
