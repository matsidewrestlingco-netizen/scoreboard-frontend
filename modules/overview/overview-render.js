// =======================================================
// File: /modules/overview/overview-render.js
// Uses universal segmentLabel()
// =======================================================

import { segmentLabel } from "../core/period-name.js";

export function renderOverview(mats) {
  const container = document.getElementById("overviewContainer");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(mats).forEach(([mat, m]) => {
    const card = document.createElement("div");
    card.className = "overview-card";

    card.innerHTML = `
      <div class="ov-mat">Mat ${mat}</div>
      <div class="ov-period">${segmentLabel(m.segmentId, m.period)}</div>
      <div class="ov-time">${m.timeFormatted}</div>

      <div class="ov-row">
        <span class="ov-red-name">${m.redName || "Red"}</span>
        <span class="ov-red-score">${m.red}</span>
      </div>
      <div class="ov-row">
        <span class="ov-green-name">${m.greenName || "Green"}</span>
        <span class="ov-green-score">${m.green}</span>
      </div>
    `;

    container.appendChild(card);
  });
}
