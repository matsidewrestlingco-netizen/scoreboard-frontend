// ============================================================
// File: modules/ui/skins.js
// Global theming system for all clients (Scoreboard, Overview,
// Control Panel). Fully socket-safe and crash-proof.
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
// Apply a theme CSS <link>
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
// Initialize THEMING on a client (scoreboard, overview, control)
// Requires a VALID SOCKET — but we handle undefined safely.
// ------------------------------------------------------------
export function initSkinClient(socket) {
  // Load any saved skin first
  const saved = localStorage.getItem("matside-skin");
  if (saved) applySkin(saved);

  // If socket not ready yet, wait until scoreboard-main or overview-main
  // finishes setting it.
  if (!socket) {
    console.warn("initSkinClient: No socket yet — deferring skin listener.");

    // Retry a few times until socket is ready
    let attempts = 0;
    const waitForSocket = setInterval(() => {
      attempts++;
      const s = window.__matside_socket;
      if (s) {
        clearInterval(waitForSocket);
        wireSkinSocket(s);
      }
      if (attempts > 20) {
        clearInterval(waitForSocket);
      }
    }, 150);

    return;
  }

  // Otherwise wire immediately
  wireSkinSocket(socket);
}

// Attach skin-update events safely
function wireSkinSocket(socket) {
  if (!socket || !socket.on) return;

  socket.on("globalSkin", key => {
    applySkin(key);
  });
}

// ------------------------------------------------------------
// Hub-side controller (admin UI)
// ------------------------------------------------------------
export function initSkinHub(serverUrl) {
  const socket = io(serverUrl);

  let initialSkin = localStorage.getItem("matside-hub-skin") || "dark-pro";

  function setGlobalSkin(key) {
    localStorage.setItem("matside-hub-skin", key);
    socket.emit("setGlobalSkin", key);
  }

  return { initialSkin, setGlobalSkin };
}
  return { setGlobalSkin, initialSkin };
}
