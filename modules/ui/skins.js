// modules/ui/skins.js
// -------------------------------------------------------
// Global theming system for all clients
// -------------------------------------------------------

export const SKINS = {
  "black-glass": {
    name: "Black Glass",
    cssUrl: "/scoreboard-frontend/css/skins/black-glass.css"
  },
  "dark-pro": {
    name: "Dark Pro",
    cssUrl: "/scoreboard-frontend/css/skins/dark-pro.css"
  },
  "classic": {
    name: "Classic",
    cssUrl: "/scoreboard-frontend/css/skins/classic.css"
  },
  "blue-glass": {
    name: "Blue Glass",
    cssUrl: "/scoreboard-frontend/css/skins/blue-glass.css"
  }
};

// Dynamically load a skin CSS file
function applySkin(skinKey) {
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

// Called on scoreboards + overview + control
export function initSkinClient(socket) {
  // Load from local storage at startup
  const saved = localStorage.getItem("matside-skin");
  if (saved && SKINS[saved]) {
    applySkin(saved);
  }

  // Listen for hub instructions
  socket?.on("globalSkin", (skinKey) => {
    if (SKINS[skinKey]) applySkin(skinKey);
  });
}

// Hub page API
export function initSkinHub(serverUrl) {
  const socket = io(serverUrl);

  let initialSkin = localStorage.getItem("matside-hub-skin") || "black-glass";

  function setGlobalSkin(key) {
    localStorage.setItem("matside-hub-skin", key);
    socket.emit("setGlobalSkin", key);
  }

  return { initialSkin, setGlobalSkin };
}

  return { setGlobalSkin, initialSkin, socket };
}
