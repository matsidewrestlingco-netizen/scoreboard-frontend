// modules/ui/control-skin-adapter.js
// ------------------------------------------------------------
// Control Panel Skin Adapter
// Reads global skin from server + applies CSS variables
// Keeps existing control panel layout intact.
// ------------------------------------------------------------

import { initSkinClient } from "./skins.js";

const { getCurrentSkin, onSkinChanged } = initSkinClient(
  "https://scoreboard-server-er33.onrender.com"
);

// Apply variables to :root
function applySkinVars(skin) {
  if (!skin || !skin.vars) return;
  const root = document.documentElement;

  for (const key of Object.keys(skin.vars)) {
    root.style.setProperty(key, skin.vars[key]);
  }
}

// Apply initial skin
(async () => {
  const s = await getCurrentSkin();
  applySkinVars(s);
})();

// Update when theme changes globally
onSkinChanged((skin) => {
  applySkinVars(skin);
});
