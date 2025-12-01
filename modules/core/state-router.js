// =========================================================
// FILE: modules/core/state-router.js
// Small helpers to read mat state
// =========================================================
export function getMatState(state, mat) {
  if (!state || !state.mats) return null;
  return state.mats[mat] || null;
}
