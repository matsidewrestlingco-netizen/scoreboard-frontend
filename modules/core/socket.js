// =========================================================
// FILE: /modules/core/socket.js
// Unified Socket.IO client for ALL front-end modules
// Supports:
//  - Dynamic server URL (setServerUrl)
//  - registerDevice handshake for hub monitor
//  - heartbeat diagnostics
//  - stateUpdate relays
//  - skin system integration
// =========================================================

let SERVER_URL = "https://scoreboard-server-er33.onrender.com";
let socket = null;

/**
 * Allow scoreboard.html, overview.html, control.html
 * to dynamically override the server URL.
 */
export function setServerUrl(url) {
  SERVER_URL = url;
}

/**
 * Retrieve the active socket URL.
 */
export function getSocketUrl() {
  return SERVER_URL;
}

/**
 * Get the active socket instance.
 */
export function getSocket() {
  return socket;
}

/**
 * Initialize Socket.IO connection.
 *
 * @param {Object} config
 * @param {string} config.role   - "control", "scoreboard", "overview"
 * @param {number|null} config.mat
 * @param {function} config.onState
 */
export function initSocketClient({ role, mat = null, onState }) {
  // Prevent multiple sockets
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
    query: { role, mat: mat || "" }
  });

  // EXPOSE GLOBALLY for skins.js to attach safely
  window.__matside_socket = socket;

  // ----------------------------
  // 1. Register device for hub
  // ----------------------------
  socket.on("connect", () => {
    socket.emit("registerDevice", {
      type: role,
      mat: mat || null
    });
  });

  // ----------------------------
  // 2. Receive state updates
  // ----------------------------
  socket.on("stateUpdate", (state) => {
    if (typeof onState === "function") {
      onState(state);
    }
  });

  // ----------------------------
  // 3. Heartbeat for hub monitor
  // ----------------------------
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
