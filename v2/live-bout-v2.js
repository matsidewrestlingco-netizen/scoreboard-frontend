// ===============================
// CONFIG
// ===============================
const BOUT_ID = '403e35a5-032c-4492-85b2-c0d1a64da5e3';

// ===============================
// SUPABASE
// ===============================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://polfteqwekkhzlhfjhsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZ0ZXF3ZWtraHpsaGZqaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTU2MzAsImV4cCI6MjA4MDY5MTYzMH0.npJCJJKOLTQddFH-xtU_ZtlT9_M8JWWpScDIsZAGY4M'
);

const PERIOD_LENGTH_MS = {
  1: 120000,
  2: 120000,
  3: 120000,
  OT: 60000
};

// ===============================
// UI STATE (FRONT-END ONLY)
// ===============================
// This is intentionally NOT persisted yet. A2.1 is UI-only.
const choiceUI = {
  isOpen: false,
  pendingPeriod: null,     // the period we need a choice for
  chooser: 'RED',          // who currently has the choice
  deferUsed: false,        // defer can happen only once per match
  lastChooser: null,       // who last made (or deferred) the choice
  // For the current period, we store an initial position hint override:
  // 'NEUTRAL' | 'RED_CONTROL' | 'GREEN_CONTROL'
  positionOverrideByPeriod: {}
};

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
// We derive context from the last meaningful action, and allow a UI-only override
// for the beginning of a period (based on the period choice modal).
function derivePositionContext(bout, actions = []) {
  const currentPeriod = bout?.current_period ?? null;

  // Helper: maps color to control context
  const controlOf = (color) => (color === 'RED' ? 'RED_CONTROL' : 'GREEN_CONTROL');

  // Walk backwards through actions to find the last context-defining event
  for (let i = actions.length - 1; i >= 0; i--) {
    const a = actions[i];
    if (!a || a.is_voided) continue;

    // If we reached the start of the current period and haven't seen
    // a context-defining action yet, use the UI override (if present).
    if (a.action_type === 'PERIOD_START' && currentPeriod != null) {
      if (a.period === currentPeriod) {
        const ov = choiceUI.positionOverrideByPeriod[currentPeriod];
        return ov || 'NEUTRAL';
      }
      // If it's a prior period start, we're still safe to return neutral baseline
      // (unless newer actions already set control above).
      return 'NEUTRAL';
    }

    // Support both “new style” (SCORE_*) and “older style” names defensively.
    switch (a.action_type) {
      // --- Primary folkstyle position drivers ---
      case 'SCORE_TAKEDOWN':
      case 'TAKEDOWN_RED':
      case 'TAKEDOWN_GREEN':
        // If your action row contains a.color (RED/GREEN), use it.
        if (a.color === 'RED' || a.color === 'GREEN') return controlOf(a.color);
        // Fallback for explicit action types:
        if (a.action_type === 'TAKEDOWN_RED') return 'RED_CONTROL';
        if (a.action_type === 'TAKEDOWN_GREEN') return 'GREEN_CONTROL';
        break;

      case 'SCORE_REVERSAL':
      case 'REVERSAL_RED':
      case 'REVERSAL_GREEN':
        if (a.color === 'RED' || a.color === 'GREEN') return controlOf(a.color);
        if (a.action_type === 'REVERSAL_RED') return 'RED_CONTROL';
        if (a.action_type === 'REVERSAL_GREEN') return 'GREEN_CONTROL';
        break;

      case 'SCORE_ESCAPE':
      case 'ESCAPE_RED':
      case 'ESCAPE_GREEN':
        return 'NEUTRAL';

      // --- These do NOT change control context ---
      case 'SCORE_NEARFALL':
      case 'PENALTY':
      case 'STALLING':
      case 'CAUTION':
      case 'UNSPORTSMANLIKE':
      case 'TECHNICAL_VIOLATION':
      case 'CLOCK_START':
      case 'CLOCK_STOP':
      case 'PERIOD_END':
      case 'MATCH_CONFIRM':
      default:
        break;
    }
  }

  // No actions found? Beginning of match => neutral.
  // If a UI override exists for current period, apply it.
  if (currentPeriod != null) {
    const ov = choiceUI.positionOverrideByPeriod[currentPeriod];
    if (ov) return ov;
  }
  return 'NEUTRAL';
}

// ===============================
// MODAL UI (A2.1 FRONT-END ONLY)
// ===============================
function ensureChoiceModal() {
  if (document.getElementById('choiceModalOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'choiceModalOverlay';
  overlay.className = 'ms-modal-overlay hidden';

  overlay.innerHTML = `
    <div class="ms-modal">
      <div class="ms-modal-header">
        <div class="ms-modal-title" id="choiceModalTitle">Period — Choice</div>
        <button class="ms-modal-x" id="choiceModalClose" title="Close">✕</button>
      </div>

      <div class="ms-modal-body">
        <div class="ms-modal-row">
          <div class="ms-modal-sub" id="choiceModalSub">Chooser</div>
        </div>

        <div class="ms-chooser-row">
          <button class="ms-pill" id="chooserRed">Red has choice</button>
          <button class="ms-pill" id="chooserGreen">Green has choice</button>
        </div>

        <div class="ms-choice-grid">
          <button class="ms-choice" id="choiceNeutral">
            <div class="ms-choice-name">Neutral</div>
            <div class="ms-choice-desc">Start neutral</div>
          </button>

          <button class="ms-choice" id="choiceTop">
            <div class="ms-choice-name">Top</div>
            <div class="ms-choice-desc">Chooser in control</div>
          </button>

          <button class="ms-choice" id="choiceBottom">
            <div class="ms-choice-name">Bottom</div>
            <div class="ms-choice-desc">Opponent in control</div>
          </button>

          <button class="ms-choice ms-choice-secondary" id="choiceDefer">
            <div class="ms-choice-name">Defer</div>
            <div class="ms-choice-desc">Pass choice</div>
          </button>
        </div>

        <div class="ms-modal-note" id="choiceModalNote"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wire close behavior
  document.getElementById('choiceModalClose').onclick = () => {
    // For A2.1, we do NOT allow closing if choice is required.
    // If you want to allow it later, we can soften this.
    alert('A starting position must be selected before continuing.');
  };

  // Chooser toggles
  document.getElementById('chooserRed').innerHTML = '<span>Red has choice</span>';
  document.getElementById('chooserGreen').innerHTML = '<span>Green has choice</span>';

  // Choices
  document.getElementById('choiceNeutral').onclick = () => applyChoice('NEUTRAL');
  document.getElementById('choiceTop').onclick = () => applyChoice('TOP');
  document.getElementById('choiceBottom').onclick = () => applyChoice('BOTTOM');
  document.getElementById('choiceDefer').onclick = () => applyChoice('DEFER');
}

function openChoiceModal(periodNumber) {
  ensureChoiceModal();

  choiceUI.isOpen = true;
  choiceUI.pendingPeriod = periodNumber;

  const overlay = document.getElementById('choiceModalOverlay');
  overlay.classList.remove('hidden');

  updateChoiceModal();
}

function closeChoiceModal() {
  choiceUI.isOpen = false;

  const overlay = document.getElementById('choiceModalOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function setChooser(color) {
  choiceUI.chooser = color;
  updateChoiceModal();
}

function otherColor(color) {
  return color === 'RED' ? 'GREEN' : 'RED';
}

function updateChoiceModal() {
  const title = document.getElementById('choiceModalTitle');
  const sub = document.getElementById('choiceModalSub');
  const note = document.getElementById('choiceModalNote');

  const chooserRed = document.getElementById('chooserRed');
  const chooserGreen = document.getElementById('chooserGreen');
  const deferBtn = document.getElementById('choiceDefer');

  title.textContent = `Period ${choiceUI.pendingPeriod} — Choice`;
  sub.textContent = `${choiceUI.chooser === 'RED' ? 'Red' : 'Green'} has the choice`;

  chooserRed.classList.add('red');
  chooserGreen.classList.add('green');

  // Highlight active chooser
  chooserRed.classList.toggle('active', choiceUI.chooser === 'RED');
  chooserGreen.classList.toggle('active', choiceUI.chooser === 'GREEN');

  // Defer availability (UI-only rule)
  const deferAllowed = !choiceUI.deferUsed;
  deferBtn.disabled = !deferAllowed;
  deferBtn.title = deferAllowed ? '' : 'Defer already used';

  note.textContent = deferAllowed
    ? 'Select Neutral, Top, Bottom, or Defer.'
    : 'Defer already used — select Neutral, Top, or Bottom.';

  note.className = deferAllowed ? 'ms-modal-note' : 'ms-modal-note warn';
note.textContent = deferAllowed
  ? 'Select Neutral, Top, Bottom, or Defer.'
  : 'Defer already used — select Neutral, Top, or Bottom.';
  
}

function applyChoice(choice) {
  const period = choiceUI.pendingPeriod;
  const chooser = choiceUI.chooser;

  if (!period) return;

  // Defer: pass the choice immediately to opponent and lock defer thereafter
  if (choice === 'DEFER') {
    if (choiceUI.deferUsed) return;

    choiceUI.deferUsed = true;
    choiceUI.lastChooser = chooser;

    // Opponent now chooses immediately; defer is now disabled.
    choiceUI.chooser = otherColor(chooser);
    updateChoiceModal();
    return;

    const note = document.getElementById('choiceModalNote');
    if (note) {
    let msg = 'Starting position set.';
    if (context === 'NEUTRAL') msg = 'Starting position set: NEUTRAL.';
    if (context === 'RED_CONTROL') msg = 'Starting position set: RED IN CONTROL.';
    if (context === 'GREEN_CONTROL') msg = 'Starting position set: GREEN IN CONTROL.';
    note.className = 'ms-modal-note good';
    note.textContent = `✓ ${msg}`;
}
  }

  // Determine the initial position hint for this period
  let context = 'NEUTRAL';

  if (choice === 'NEUTRAL') {
    context = 'NEUTRAL';
  } else if (choice === 'TOP') {
    context = chooser === 'RED' ? 'RED_CONTROL' : 'GREEN_CONTROL';
  } else if (choice === 'BOTTOM') {
    // Opponent in control
    const opp = otherColor(chooser);
    context = opp === 'RED' ? 'RED_CONTROL' : 'GREEN_CONTROL';
  }

  // Store UI-only override for the current period
  choiceUI.positionOverrideByPeriod[period] = context;

  // Close and clear pending
  closeChoiceModal();
  choiceUI.pendingPeriod = null;

  // Re-render banner immediately
  refresh();
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

        <div id="clockDisplay" class="clock">--:--.-</div>

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

  const position = derivePositionContext(bout, actions);

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
    ${
      choiceUI.isOpen
        ? `<div class="position-hint neutral">Select starting position for Period ${choiceUI.pendingPeriod}…</div>`
        : ''
    }
  `;
}

function renderActions(bout) {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  // Helper to disable controls while choice modal is open for current period
  const choicePendingNow =
    choiceUI.isOpen &&
    choiceUI.pendingPeriod != null &&
    bout.current_period === choiceUI.pendingPeriod &&
    bout.state === 'BOUT_IN_PROGRESS';

  // -----------------------------
  // CLOCK HELPERS
  // -----------------------------

let _clockTimer = null;
let _clockBaseMs = 0;      // remaining ms at last sync
let _clockBaseTs = 0;      // performance.now() at last sync
let _clockRunning = false;

function formatClockMs(ms) {
  const clamped = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((clamped % 1000) / 100); // 0-9

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

function getDisplayedClockMs() {
  if (!_clockRunning) return _clockBaseMs;
  const elapsed = performance.now() - _clockBaseTs;
  return _clockBaseMs - elapsed; // countdown
}

function updateClockDisplay() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  el.textContent = formatClockMs(getDisplayedClockMs());
}

function stopClockTicker() {
  if (_clockTimer) {
    clearInterval(_clockTimer);
    _clockTimer = null;
  }
}

function startClockTicker() {
  stopClockTicker();
  // 100ms tick for tenths display
  _clockTimer = setInterval(updateClockDisplay, 100);
}

function syncClockFromBout(bout) {
  console.log('[clock]', { running: bout.clock_running, ms: bout.clock_ms, period: bout.current_period });
  // Expecting bout.clock_ms = remaining time in ms
  const ms = Number(bout.clock_ms ?? 0);
  _clockBaseMs = Number.isFinite(ms) ? ms : 0;
  _clockRunning = !!bout.clock_running;
  _clockBaseTs = performance.now();

  updateClockDisplay();

  if (_clockRunning) startClockTicker();
  else stopClockTicker();
}
  
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
    const scoreCard = document.createElement('div');
    scoreCard.className = 'card score-card';

    const redGroup = document.createElement('div');
    redGroup.className = 'score-group red';
    redGroup.innerHTML = `<div class="label red-label">RED</div>`;
    const tdRed = secondaryBtn('+3 TD', () => score('RED', 3));
    tdRed.disabled = choicePendingNow;
    redGroup.appendChild(tdRed);

    const greenGroup = document.createElement('div');
    greenGroup.className = 'score-group green';
    greenGroup.innerHTML = `<div class="label green-label">GREEN</div>`;
    const tdGreen = secondaryBtn('+3 TD', () => score('GREEN', 3));
    tdGreen.disabled = choicePendingNow;
    greenGroup.appendChild(tdGreen);

    scoreCard.append(redGroup, greenGroup);

    const clockBtn = bout.clock_running
      ? primaryBtn('Stop Clock', clockStop)
      : primaryBtn('Start Clock', clockStart);

    // Block clock until choice is made (UI-only)
    clockBtn.disabled = choicePendingNow;

    const endPeriodBtn = secondaryBtn('End Period', endPeriod);
    // You can still end period without a choice pending, but once choice is pending, don’t allow it again
    endPeriodBtn.disabled = choicePendingNow;

    const undoBtn = dangerBtn('Undo Last Action', undoLastAction);
    // Undo can remain available; if you prefer to lock it while modal open, set disabled = choicePendingNow
    // undoBtn.disabled = choicePendingNow;

    const endMatchBtn = dangerBtn('End Match', endMatch);
    // End match can remain available

    panel.append(scoreCard, clockBtn, endPeriodBtn, undoBtn, endMatchBtn);
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
  // End period in backend (auto-advances and starts next period)
  const ok = await rpc('rpc_end_period');

  if (!ok) return;

  // After backend moves us to the next period, require a choice (UI-only)
  const bout = await lastBoutSnapshot();
  if (!bout) return;

  // Only prompt for choice if match still in progress
  if (bout.state === 'BOUT_IN_PROGRESS') {
    // Default chooser: RED (ref can toggle). If you want to get fancy,
    // we can set default chooser to the wrestler who didn't choose last time.
    openChoiceModal(bout.current_period);
  }
}

async function endMatch() {
  if (!confirm('End match and finalize result?')) return;
  await rpc('rpc_end_match');
}

// ===============================
// RPC HELPER
// ===============================
let _lastBout = null;

async function rpc(name, extra = {}) {
  const { error } = await supabase.rpc(name, {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID,
    ...extra
  });

  if (error) {
    console.error(`${name} error:`, error);
    alert(`Failed to ${name.replace('rpc_', '').replaceAll('_', ' ')}`);
    return false;
  }

  flash();
  await refresh();
  return true;
}

async function lastBoutSnapshot() {
  if (_lastBout) return _lastBout;
  const bout = await fetchBout();
  return bout;
}

// ===============================
// FEEDBACK
// ===============================
function flash() {
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), 120);
}

// ===============================
// CLOCK (COUNTDOWN, MM:SS.t)
// ===============================
let _clockTimer = null;
let _clockBaseMs = 0;      // remaining ms at last sync
let _clockBaseTs = 0;      // performance.now() at last sync
let _clockRunning = false;

function formatClockMs(ms) {
  const clamped = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((clamped % 1000) / 100); // 0-9

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

function getDisplayedClockMs() {
  if (!_clockRunning) return _clockBaseMs;
  const elapsed = performance.now() - _clockBaseTs;
  return _clockBaseMs - elapsed; // countdown
}

function updateClockDisplay() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  el.textContent = formatClockMs(getDisplayedClockMs());
}

function stopClockTicker() {
  if (_clockTimer) {
    clearInterval(_clockTimer);
    _clockTimer = null;
  }
}

function startClockTicker() {
  stopClockTicker();
  _clockTimer = setInterval(updateClockDisplay, 100); // tenths
}

function syncClockFromBout(bout) {
  const ms = Number(bout.clock_ms ?? 0);
  _clockBaseMs = Number.isFinite(ms) ? ms : 0;
  _clockRunning = !!bout.clock_running;
  _clockBaseTs = performance.now();

  updateClockDisplay();

  if (_clockRunning) startClockTicker();
  else stopClockTicker();
}

// ===============================
// REFRESH
// ===============================
async function refresh() {
  const bout = await fetchBout();
  if (!bout) return;

  _lastBout = bout;

  renderHeader(bout);
  syncClockFromBout(bout);
  renderStateBanner(bout, bout.actions || []);
  renderActions(bout);
}

// INITIAL LOAD
refresh();
