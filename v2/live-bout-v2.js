// ===============================
// CONFIG
// ===============================
const BOUT_ID = 'd51a057f-923b-45e8-bc77-10036bd21ccc';

const MAX_REG_PERIODS = 3;
const MAX_OT_PERIODS  = 4;
const MAX_PERIOD      = MAX_REG_PERIODS + MAX_OT_PERIODS; // 7 total

// V2 UI fallback (until backend period timing is fully authoritative)
const PERIOD_LENGTH_MS = {
  1: 120000, // 2:00
  2: 120000,
  3: 120000,
  4: 60000,  // OT1 default 1:00
  5: 60000,  // OT2
  6: 60000,  // OT3
  7: 60000,  // OT4 (max)
};

// ===============================
// SUPABASE
// ===============================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://polfteqwekkhzlhfjhsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZ0ZXF3ZWtraHpsaGZqaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTU2MzAsImV4cCI6MjA4MDY5MTYzMH0.npJCJJKOLTQddFH-xtU_ZtlT9_M8JWWpScDIsZAGY4M'
);

// ===============================
// UI STATE (FRONT-END ONLY)
// ===============================
const choiceUI = {
  isOpen: false,
  pendingPeriod: null,
  chooser: 'RED',
  deferUsed: false,
  lastChooser: null,
  positionOverrideByPeriod: {}, // period -> 'NEUTRAL'|'RED_CONTROL'|'GREEN_CONTROL'
};

// More-menu UI state
let _moreOpen = false;

// ===============================
// FETCH
// ===============================
async function fetchBout() {
  const { data, error } = await supabase.rpc('rpc_get_bout', { p_bout_id: BOUT_ID });

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
function derivePositionContext(bout, actions = []) {
  const currentPeriod = bout?.current_period ?? null;
  const controlOf = (color) => (color === 'RED' ? 'RED_CONTROL' : 'GREEN_CONTROL');

  for (let i = actions.length - 1; i >= 0; i--) {
    const a = actions[i];
    if (!a || a.is_voided) continue;

    // If we reached current period start without context, apply UI override
    if (a.action_type === 'PERIOD_START' && currentPeriod != null) {
      if (a.period === currentPeriod) {
        const ov = choiceUI.positionOverrideByPeriod[currentPeriod];
        return ov || 'NEUTRAL';
      }
      return 'NEUTRAL';
    }

    switch (a.action_type) {
      case 'SCORE_TAKEDOWN':
      case 'TAKEDOWN_RED':
      case 'TAKEDOWN_GREEN':
        if (a.color === 'RED' || a.color === 'GREEN') return controlOf(a.color);
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

      default:
        break;
    }
  }

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
          <button class="ms-pill red" id="chooserRed"><span>Red has choice</span></button>
          <button class="ms-pill green" id="chooserGreen"><span>Green has choice</span></button>
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

  // Do not allow closing when required (A2.1)
  document.getElementById('choiceModalClose').onclick = () => {
    alert('A starting position must be selected before continuing.');
  };

  // Wire chooser toggles (this was missing in your current file)
  document.getElementById('chooserRed').onclick = () => setChooser('RED');
  document.getElementById('chooserGreen').onclick = () => setChooser('GREEN');

  // Wire choices
  document.getElementById('choiceNeutral').onclick = () => applyChoice('NEUTRAL');
  document.getElementById('choiceTop').onclick = () => applyChoice('TOP');
  document.getElementById('choiceBottom').onclick = () => applyChoice('BOTTOM');
  document.getElementById('choiceDefer').onclick = () => applyChoice('DEFER');
}

function openChoiceModal(periodNumber) {
  ensureChoiceModal();
  _moreOpen = false;

  if (Number(periodNumber) > MAX_PERIOD) {
    alert(`Max periods reached (${MAX_PERIOD}). End match / confirm result.`);
    return;
  }
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

  chooserRed.classList.toggle('active', choiceUI.chooser === 'RED');
  chooserGreen.classList.toggle('active', choiceUI.chooser === 'GREEN');

  const deferAllowed = !choiceUI.deferUsed;
  deferBtn.disabled = !deferAllowed;
  deferBtn.title = deferAllowed ? '' : 'Defer already used';

  note.className = deferAllowed ? 'ms-modal-note' : 'ms-modal-note warn';
  note.textContent = deferAllowed
    ? 'Select Neutral, Top, Bottom, or Defer.'
    : 'Defer already used — select Neutral, Top, or Bottom.';
}

function applyChoice(choice) {
  const period = choiceUI.pendingPeriod;
  const chooser = choiceUI.chooser;

  if (!period) return;

  // Defer: pass choice immediately and lock defer
  if (choice === 'DEFER') {
    if (choiceUI.deferUsed) return;

    choiceUI.deferUsed = true;
    choiceUI.lastChooser = chooser;

    // Opponent now chooses; defer now disabled
    choiceUI.chooser = otherColor(chooser);
    updateChoiceModal();
    return;
  }

  // Determine initial position hint for this period
  let context = 'NEUTRAL';

  if (choice === 'NEUTRAL') {
    context = 'NEUTRAL';
  } else if (choice === 'TOP') {
    context = chooser === 'RED' ? 'RED_CONTROL' : 'GREEN_CONTROL';
  } else if (choice === 'BOTTOM') {
    const opp = otherColor(chooser);
    context = opp === 'RED' ? 'RED_CONTROL' : 'GREEN_CONTROL';
  }

  // Store UI-only override for this period
  choiceUI.positionOverrideByPeriod[period] = context;

  // Close + clear pending
  closeChoiceModal();
  choiceUI.pendingPeriod = null;

  // Re-render
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
    label = bout.clock_running ? 'LIVE • Clock Running' : 'Paused • Clock Stopped';
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
    ${positionLabel ? `<div class="position-hint ${position.toLowerCase()}">${positionLabel}</div>` : ''}
    ${
      choiceUI.isOpen
        ? `<div class="position-hint neutral">Select starting position for Period ${choiceUI.pendingPeriod}…</div>`
        : ''
    }
  `;
}

// ===============================
// CONFIRM BUTTON (DOUBLE TAP)
// ===============================
function doubleTapConfirmBtn(label, confirmLabel, fn, windowMs = 2000) {
  const b = document.createElement('button');
  b.className = 'secondary';
  b.textContent = label;

  let armed = false;
  let t = null;

  const disarm = () => {
    armed = false;
    b.classList.remove('armed');
    b.textContent = label;
    if (t) clearTimeout(t);
    t = null;
  };

  b.onclick = async () => {
    if (!armed) {
      armed = true;
      b.classList.add('armed');
      b.textContent = confirmLabel;
      t = setTimeout(disarm, windowMs);
      return;
    }
    disarm();
    await fn();
  };

  // If it gets disabled (e.g., modal opens), disarm for safety
  const obs = new MutationObserver(() => { if (b.disabled) disarm(); });
  obs.observe(b, { attributes: true, attributeFilter: ['disabled'] });

  return b;
}

function renderActions(bout) {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  const choicePendingNow =
    choiceUI.isOpen &&
    choiceUI.pendingPeriod != null &&
    bout.current_period === choiceUI.pendingPeriod &&
    bout.state === 'BOUT_IN_PROGRESS';

  // READY
  if (bout.state === 'BOUT_READY') {
    panel.appendChild(primaryBtn('Start Match', startMatch));
    return;
  }

  // IN PROGRESS
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

    clockBtn.disabled = choicePendingNow;

    const undoBtn = dangerBtn('Undo Last Action', undoLastAction);
    const endMatchBtn = dangerBtn('End Match', endMatch);

    // Main controls (keep clean)
    panel.append(scoreCard, clockBtn, undoBtn, endMatchBtn);

    // More menu (rare actions)
    const moreBtn = secondaryBtn(_moreOpen ? 'Less' : 'More', () => {
      _moreOpen = !_moreOpen;
      renderActions(bout);
    });
    moreBtn.disabled = choicePendingNow;
    panel.append(moreBtn);

    if (_moreOpen) {
      const moreCard = document.createElement('div');
      moreCard.className = 'card more-panel';

      const endPeriodConfirm = doubleTapConfirmBtn(
        'End Period',
        'Tap again to END PERIOD',
        endPeriod,
        2000
      );
      endPeriodConfirm.disabled = choicePendingNow || !['PERIOD_ACTIVE','PERIOD_PAUSED'].includes(bout.period_state);

      moreCard.append(endPeriodConfirm);
      panel.append(moreCard);
    }

    return;
  }

  // COMPLETE
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
    p_points: points,
  });
}

async function undoLastAction() {
  await rpc('rpc_undo_last_action');
}

// Optimistic clock: starts ticking immediately after RPC success
async function clockStart() {
  const ok = await rpc('rpc_clock_action', { p_action_type: 'CLOCK_START' });
  if (!ok) return;

  if (_clockBaseMs <= 0) {
    _clockBaseMs = PERIOD_LENGTH_MS[_lastBout?.current_period] ?? 120000;
  }
  _clockRunning = true;
  _clockBaseTs = performance.now();
  _desiredRunning = true;
  _desiredRunningUntil = Date.now() + 2000;
  startClockTicker();
}

async function clockStop() {
  const ok = await rpc('rpc_clock_action', { p_action_type: 'CLOCK_STOP' });
  if (!ok) return;

  _clockBaseMs = getDisplayedClockMs();
  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = Date.now() + 2000;
  stopClockTicker();
  updateClockDisplay();
}

async function endPeriod() {
  // Front-end guard (backend should also enforce)
  if (_lastBout && !['PERIOD_ACTIVE','PERIOD_PAUSED'].includes(_lastBout.period_state)) {
    alert('Cannot end period unless it is active/paused.');
    return;
  }
  if (_lastBout && Number(_lastBout.current_period) >= MAX_PERIOD) {
    alert(`Max periods reached (${MAX_PERIOD}). End match / confirm result.`);
    return;
  }

  const ok = await rpc('rpc_end_period');
  if (!ok) return;

  // Fetch fresh state (cached _lastBout may be pre-period-advance)
  const bout = await fetchBout();
  if (!bout) return;

  _lastBout = bout;


  // Auto-end reset when period advances
  const newKey = `${BOUT_ID}:${bout.current_period}`;
  if (_autoEndFiredKey && _autoEndFiredKey !== newKey) {
    _autoEndFiredKey = null;
  }

  renderHeader(bout);
  syncClockFromBout(bout);
  renderStateBanner(bout, bout.actions || []);
  renderActions(bout);

  if (bout.state === 'BOUT_IN_PROGRESS') {
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
    ...extra,
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

// ===============================
// FEEDBACK
// ===============================
function flash() {
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), 120);
}

// ===============================
// CLOCK (COUNTDOWN, MM:SS.t) + SERVER-LAG GRACE
// ===============================
let _clockTimer = null;
let _clockBaseMs = 0;      // remaining ms at last sync
let _clockBaseTs = 0;      // performance.now() at last sync
let _clockRunning = false;

// Used to avoid “server lag stops the clock” right after a click
let _desiredRunning = null;   // true/false/null
let _desiredRunningUntil = 0; // epoch ms


// Auto-end (UI-driven V2.1): when local clock reaches 0, end period once
let _autoEndInFlight = false;
let _autoEndFiredKey = null;

function formatClockMs(ms) {
  const clamped = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((clamped % 1000) / 100);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}

function getDisplayedClockMs() {
  if (!_clockRunning) return _clockBaseMs;
  const elapsed = performance.now() - _clockBaseTs;
  return _clockBaseMs - elapsed;
}

function updateClockDisplay() {
  const el = document.getElementById('clockDisplay');
  if (!el) return;
  el.textContent = formatClockMs(getDisplayedClockMs());
  maybeAutoEndPeriod();
}


function maybeAutoEndPeriod() {
  // Only auto-end while running and only once per period
  if (!_clockRunning) return;

  const remaining = getDisplayedClockMs();
  if (remaining > 0) return;

  const period = _lastBout?.current_period ?? null;
  const boutState = _lastBout?.state ?? null;
  const periodState = _lastBout?.period_state ?? null;

  // Safety: only during an in-progress bout and during an active period
  if (boutState !== 'BOUT_IN_PROGRESS' || period == null) return;
  if (Number(period) > MAX_PERIOD) return;
  if (periodState !== 'PERIOD_ACTIVE') return;

  const key = `${BOUT_ID}:${period}`;
  if (_autoEndInFlight) return;
  if (_autoEndFiredKey === key) return;

  // Arm + freeze UI at exactly 0 (no recursion)
  _autoEndInFlight = true;
  _autoEndFiredKey = key;

  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = Date.now() + 2000;
  _clockBaseMs = 0;

  stopClockTicker();

  const el = document.getElementById('clockDisplay');
  if (el) el.textContent = '00:00.0';

  // Fire the real transition (async, guarded)
  endPeriod()
    .catch((e) => console.error('auto endPeriod error:', e))
    .finally(() => {
      _autoEndInFlight = false;
    });
}

function stopClockTicker() {
  if (_clockTimer) {
    clearInterval(_clockTimer);
    _clockTimer = null;
  }
}

function startClockTicker() {
  stopClockTicker();
  _clockTimer = setInterval(updateClockDisplay, 100);
}

function syncClockFromBout(bout) {
  const now = performance.now();

  // What the UI currently believes (pre-refresh), used to avoid "jumping" upward
  const localRemaining = (_clockRunning ? getDisplayedClockMs() : _clockBaseMs);

  // What the backend reports
  let serverMs = Number(bout.clock_ms ?? 0);
  if (!Number.isFinite(serverMs)) serverMs = 0;

  const serverRunning = !!bout.clock_running;
  const inGrace = Date.now() < _desiredRunningUntil;
  const effectiveRunning = serverRunning || (inGrace && _desiredRunning === true);

  // If the backend isn't authoritative yet, NEVER let refresh reset the clock upward.
  if (effectiveRunning) {
    if (serverMs <= 0) {
      // backend not tracking remaining; keep local if we have it, else init from defaults
      serverMs = (localRemaining > 0)
        ? localRemaining
        : (PERIOD_LENGTH_MS[bout.current_period] ?? 0);
    } else {
      // Prevent "reset to full period" when backend returns stale values during running clock
      if (localRemaining > 0 && serverMs > localRemaining + 500) {
        serverMs = localRemaining;
      }
    }
  } else {
    // Not running: prefer backend, but fall back to local/default if backend gives 0
    if (serverMs <= 0 && bout.state === 'BOUT_IN_PROGRESS') {
      serverMs = (localRemaining > 0)
        ? localRemaining
        : (PERIOD_LENGTH_MS[bout.current_period] ?? 0);
    }
  }

  _clockBaseMs = Math.max(0, serverMs);
  _clockBaseTs = now;
  _clockRunning = effectiveRunning;

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
