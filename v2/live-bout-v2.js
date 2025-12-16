const BOUT_ID = 'hardcoded-for-now';

async function fetchBout() {
  // SELECT * FROM matside_v2.bouts WHERE id = BOUT_ID
}

function render(bout) {
  renderHeader(bout);
  renderStateBanner(bout);
  renderActions(bout);
}

async function startMatch() {
  await rpc('rpc_bout_start', { bout_id: BOUT_ID });
  await refresh();
}

async function score(color, points) {
  await rpc('rpc_apply_score_action', { /* explicit args */ });
  await refresh();
}

async function refresh() {
  const bout = await fetchBout();
  render(bout);
}

console.log('live-bout-v2 loaded');

document.getElementById('boutHeader').innerHTML = `
  <h2>V2 Live Bout Control</h2>
  <div class="muted">JS is running</div>
`;

document.getElementById('stateBanner').innerHTML = `
  <strong>BOOTSTRAP STATE</strong>
  <div class="muted">No engine data yet</div>
`;

document.getElementById('actionPanel').innerHTML = `
  <button class="secondary">Placeholder Button</button>
`;
