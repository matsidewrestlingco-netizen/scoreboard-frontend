// ===============================
// CONFIG
// ===============================
const BOUT_ID = 'PUT_YOUR_BOUT_ID_HERE';

// ===============================
// SUPABASE
// ===============================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://polfteqwekkhzlhfjhsn.supabase.co',
  'YOUR_PUBLIC_ANON_KEY'
);

// ===============================
// FETCH
// ===============================
async function fetchBout() {
  const { data, error } = await supabase.rpc('rpc_get_bout', {
    p_bout_id: BOUT_ID
  });

  if (error) {
    console.error('fetchBout error:', error);
    alert('Failed to fetch bout');
    return null;
  }

  return data;
}

// ===============================
// POSITION CONTEXT (DERIVED)
// ===============================
function derivePositionContext(actions = []) {
  if (!actions || actions.length === 0) return 'NEUTRAL';

  for (let i = actions.length - 1; i >= 0; i--) {
    const a = actions[i];
    if (a.is_voided) continue;

    switch (a.action_type) {
      case 'TAKEDOWN_RED':
      case 'REVERSAL_RED':
        return 'RED_CONTROL';

      case 'TAKEDOWN_GREEN':
      case 'REVERSAL_GREEN':
        return 'GREEN_CONTROL';

      case 'ESCAPE_RED':
      case 'ESCAPE_GREEN':
        return 'NEUTRAL';
    }
  }

  return 'NEUTRAL';
}

// ===============================
// RENDER
// ===============================
function renderHeader(bout) {
  document.getElementById('boutHeader').innerHTML = `
    <div class="row">
      <div>
        <h2>${bout.red_name}</h2>
        <div class="muted">RED</div>
      </div>

      <div class="center">
        <div class="score">
          ${bout.red_score} – ${bout.green_score}
        </div>
        <div class="muted">Period ${bout.current_period}</div>
      </div>

      <div class="right">
        <h2>${bout.green_name}</h2>
        <div class="muted">GREEN</div>
      </div>
    </div>
  `;
}

function renderStateBanner(bout, actions = []) {
  const banner = document.getElementById('stateBanner');

  let stateClass = 'idle';
  let label = 'Ready';

  if (bout.state === 'BOUT_IN_PROGRESS') {
    stateClass = bout.clock_running ? 'live' : 'paused';
    label = bout.clock_running
      ? 'LIVE • Clock Running'
      : 'Paused • Clock Stopped';
  }

  if (bout.state === 'BOUT_COMPLETE') {
    stateClass = 'complete';
    label = `FINAL • Winner: ${bout.winner}`;
  }

  // 🔑 Derived position context
  const position = derivePositionContext(actions);

  let positionLabel = '';
  if (bout.state === 'BOUT_IN_PROGRESS') {
    if (position === 'RED_CONTROL') positionLabel = 'RED IN CONTROL';
    if (position === 'GREEN_CONTROL') positionLabel = 'GREEN IN CONTROL';
    if (position === 'NEUTRAL') positionLabel = 'NEUTRAL';
  }

  banner.className = `state-banner ${stateClass}`;
  banner.innerHTML = `
    <strong>${label}</strong>
    ${
      positionLabel
        ? `<div class="position-hint ${position.toLowerCase()}">${positionLabel}</div>`
        : ''
    }
  `;
}

function renderActions(bout) {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  // -----------------------------
  // READY
  // -----------------------------
  if (bout.state === 'BOUT_READY') {
    panel.appendChild(primaryBtn('Start Match', startMatch));
    return;
  }

  // -----------------------------
  // IN PROGRESS
  // -----------------------------
  if (bout.state === 'BOUT_IN_PROGRESS') {
    // SCORE CARD
    const scoreCard = document.createElement('div');
    scoreCard.className = 'card score-card';

    const redGroup = document.createElement('div');
    redGroup.className = 'score-group red';
    redGroup.innerHTML = `<div class="label red-label">RED</div>`;
    redGroup.appendChild(
      secondaryBtn('+3 TD', () => score('RED', 3))
    );

    const greenGroup = document.createElement('div');
    greenGroup.className = 'score-group green';
    greenGroup.innerHTML = `<div class="label green-label">GREEN</div>`;
    greenGroup.appendChild(
      secondaryBtn('+3 TD', () => score('GREEN', 3))
    );

    scoreCard.append(redGroup, greenGroup);

    const clockBtn = bout.clock_running
      ? primaryBtn('Stop Clock', clockStop)
      : primaryBtn('Start Clock', clockStart);

    panel.append(
      scoreCard,
      clockBtn,
      secondaryBtn('End Period', endPeriod),
      dangerBtn('Undo Last Action', undoLastAction),
      dangerBtn('End Match', endMatch)
    );
    return;
  }

  // -----------------------------
  // COMPLETE
  // -----------------------------
  if (bout.state === 'BOUT_COMPLETE') {
    panel.innerHTML = `
      <div class="locked">
        <h2>FINAL</h2>
        <div class="winner">Winner: ${bout.winner}</div>
      </div>
    `;
  }
}

// ===============================
// BUTTON HELPERS
// ===============================
function primaryBtn(label, fn) {
  const b = document.createElement('button');
  b.className = 'primary';
  b.textContent = label;
  b.onclick = fn;
  return b;
}

function secondaryBtn(label, fn) {
  const b = document.createElement('button');
  b.className = 'secondary';
  b.textContent = label;
  b.onclick = fn;
  return b;
}

function dangerBtn(label, fn) {
  const b = document.createElement('button');
  b.className = 'danger';
  b.textContent = label;
  b.onclick = fn;
  return b;
}

// ===============================
// ACTIONS
// ===============================
async function startMatch() {
  await rpc('rpc_bout_start');
}

async function score(color, points) {
  await rpc('rpc_apply_score_action', {
    p_action_type: 'SCORE_TAKEDOWN',
    p_color: color,
    p_points: points
  });
}

async function undoLastAction() {
  await rpc('rpc_undo_last_action');
}

async function clockStart() {
  await rpc('rpc_clock_action', { p_action_type: 'CLOCK_START' });
}

async function clockStop() {
  await rpc('rpc_clock_action', { p_action_type: 'CLOCK_STOP' });
}

async function endPeriod() {
  await rpc('rpc_end_period');
}

async function endMatch() {
  if (!confirm('End match and finalize result?')) return;
  await rpc('rpc_end_match');
}

// ===============================
// RPC HELPER
// ===============================
async function rpc(name, extra = {}) {
  const { error } = await supabase.rpc(name, {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID,
    ...extra
  });

  if (error) {
    console.error(`${name} error:`, error);
    alert(`Failed to ${name.replace('rpc_', '').replaceAll('_', ' ')}`);
    return;
  }

  flash();
  await refresh();
}

// ===============================
// FEEDBACK
// ===============================
function flash() {
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), 120);
}

// ===============================
// REFRESH
// ===============================
async function refresh() {
  const bout = await fetchBout();
  if (!bout) return;

  renderHeader(bout);
  renderStateBanner(bout, bout.actions || []);
  renderActions(bout);
}

// INITIAL LOAD
refresh();
