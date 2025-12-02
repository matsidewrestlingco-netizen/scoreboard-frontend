// ============================================================
// File: modules/ui/skins.js
// Global theming system (Scoreboard, Overview, Control Panel)
// Fully socket-safe — NO top-level returns.
// ============================================================

export const SKINS = {
  "dark-pro": {
    name: "Dark Pro",
    cssUrl: "/skins/dark-pro.css"
  },
  "classic": {
    name: "Classic",
    cssUrl: "/skins/classic.css"
  },
  "blueglass": {
    name: "Blue Glass",
    cssUrl: "/skins/blue-glass.css"
  }
};

// ------------------------------------------------------------
// Apply <link> stylesheet for a theme
// ------------------------------------------------------------
export function applySkin(skinKey) {
  const skin = SKINS[skinKey];
  if (!skin) return;

  let link = document.getElementById("skinStylesheet");
  if (!link) {
    link = document.createElement("link");
    link.id = "skinStylesheet";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  link.href = skin.cssUrl;
  localStorage.setItem("matside-skin", skinKey);
}

// ------------------------------------------------------------
// Wire socket listener (safe wrapper)
// ------------------------------------------------------------
function wireSkinSocket(socket) {
  if (!socket || !socket.on) return;
  socket.on("globalSkin", key => applySkin(key));
}

// ------------------------------------------------------------
// Initialize client theming
// SAFE even if socket is undefined at first load.
// ------------------------------------------------------------
export function initSkinClient(socket) {
  // 1. Apply local setting immediately
  const saved = localStorage.getItem("matside-skin");
  if (saved) applySkin(saved);

  // 2. If socket exists immediately → wire it
  if (socket && socket.on) {
    wireSkinSocket(socket);
    return;
  }

  // 3. If no socket yet, poll briefly until scoreboard-main sets it
  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    const s = window.__matside_socket;
    if (s) {
      clearInterval(poll);
      wireSkinSocket(s);
    }
    if (attempts > 20) clearInterval(poll);
  }, 150);
}

// ------------------------------------------------------------
// Hub-side skin controller
// ------------------------------------------------------------
export function initSkinHub(serverUrl) {
  const socket = io(serverUrl);

  const initialSkin =
    localStorage.getItem("matside-hub-skin") || "dark-pro";

  function setGlobalSkin(key) {
    localStorage.setItem("matside-hub-skin", key);
    socket.emit("setGlobalSkin", key);
  }

  return { initialSkin, setGlobalSkin };
}
