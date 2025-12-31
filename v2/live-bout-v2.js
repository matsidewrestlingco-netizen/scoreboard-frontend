// ===============================
// CONFIG
// ===============================
const BOUT_ID = 'd51a057f-923b-45e8-bc77-10036bd21ccc';

// V2 UI fallback (until backend period timing is fully authoritative)
const PERIOD_LENGTH_MS = {
  1: 120000, // 2:00
  2: 120000,
  3: 120000,
  // OT: 60000, // later
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
  deferUsedByColor: { RED: false, GREEN: false },
  deferredColor: null, // color that deferred and is owed next choice
  lastChoiceColor: null, // last color that made a non-defer choice
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


async function fetchMatQueue(matId) {
  if (!matId) {
    return { rows: [], error: { message: 'Missing mat_id on bout (rpc_get_bout must return mat_id)' } };
  }

  const { data, error } = await supabase.rpc('rpc_get_mat_queue', {
    p_mat_id: matId,
    p_limit: 25
  });

  if (error) {
    console.error('fetchMatQueue error:', error);
    return { rows: [], error };
  }

  return { rows: (Array.isArray(data) ? data : []), error: null };
}

function gotoBout(boutId) {
  if (!boutId) return;
  const url = new URL(window.location.href);
  url.searchParams.set('bout_id', boutId);
  window.location.href = url.toString(); // simple + reliable
}

async function renderMatQueue(bout) {
  const panel = document.getElementById('actionPanel');
  if (!panel) return;

  // Ensure container exists (always at bottom of panel)
  let q = document.getElementById('matQueue');
  if (!q) {
    q = document.createElement('div');
    q.id = 'matQueue';
    q.className = 'mat-queue';
    panel.appendChild(q);
  }

  const matId = bout?.mat_id;
  console.log('[matQueue]', { bout_id: bout?.id, mat_id: matId, state: bout?.state });
  if (!matId) {
    q.innerHTML = '';
    return;
  }

  const res = await fetchMatQueue(matId);
  const rows = res.rows;

  const currentId = bout?.id;
  const items = rows
    .filter(r => r && r.id)
    .slice(0, 25);

  q.innerHTML = `
    <div class="mat-queue__header">
      <div class="mat-queue__title">Mat Queue</div>
      <div class="mat-queue__sub">Mat: ${escapeHtml(matId)} • ${items.length} bout(s)</div>
    </div>
    <div class="mat-queue__list" id="matQueueList"></div>
  `;

  const list = q.querySelector('#matQueueList');
  if (!list) return;

  if (res.error) {
    list.innerHTML = `<div class="muted" style="padding:10px;">
      Queue error: ${escapeHtml(res.error.message || 'Unknown')}<br/>
      (Check: RPC exists, permissions/RLS, and rpc_get_bout returns mat_id)
    </div>`;
    return;
  }

  if (items.length === 0) {
    list.innerHTML = `<div class="muted" style="padding:10px;">No bouts found for this mat.</div>`;
    return;
  }

  for (const r of items) {
    const btn = document.createElement('button');
    btn.className = 'mat-queue__item' + (r.id === currentId ? ' active' : '');
    btn.type = 'button';
    btn.onclick = () => gotoBout(r.id);

    const label = `#${r.bout_order ?? '?'}  ${r.red_name ?? 'Red'} vs ${r.green_name ?? 'Green'}`;
    const state = (r.state ?? '').toString().replaceAll('_', ' ');
    btn.innerHTML = `
      <div class="mq-left">
        <div class="mq-label">${escapeHtml(label)}</div>
        <div class="mq-state">${escapeHtml(state)}</div>
      </div>
      <div class="mq-right">
        ${r.id === currentId ? '<span class="mq-pill">CURRENT</span>' : '<span class="mq-pill">LOAD</span>'}
      </div>
    `;
    list.appendChild(btn);
  }
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
  // Freeze clock/ticker while choosing (never auto-start)
  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = 0;
  stopClockTicker();

  choiceUI.isOpen = true;
  choiceUI.pendingPeriod = periodNumber;
  // Lock chooser based on prior choices / defer rules
  const allowed = getAllowedChooserForPeriod(periodNumber);
  choiceUI.chooser = (allowed === 'RED' || allowed === 'GREEN') ? allowed : null;

  const overlay = document.getElementById('choiceModalOverlay');
  overlay.classList.remove('hidden');

  updateChoiceModal();
}

function closeChoiceModal() {
  // Never auto-start the clock from modal actions
  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = 0;
  stopClockTicker();

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

function getAllowedChooserForPeriod(periodNumber) {
  // If someone deferred earlier, they get the next choice (and cannot defer)
  if (choiceUI.deferredColor) return choiceUI.deferredColor;

  // Otherwise, the next chooser is the opposite of whoever last made a choice
  if (choiceUI.lastChoiceColor) return otherColor(choiceUI.lastChoiceColor);

  // Default: unknown (coin flip). Let user choose RED or GREEN.
  return null;
}

function updateChoiceModal() {
  const title = document.getElementById('choiceModalTitle');
  const sub = document.getElementById('choiceModalSub');
  const note = document.getElementById('choiceModalNote');

  const chooserRed = document.getElementById('chooserRed');
  const chooserGreen = document.getElementById('chooserGreen');

  const btnNeutral = document.getElementById('choiceNeutral');
  const btnTop = document.getElementById('choiceTop');
  const btnBottom = document.getElementById('choiceBottom');
  const deferBtn = document.getElementById('choiceDefer');

  const allowedChooser = getAllowedChooserForPeriod(choiceUI.pendingPeriod);
  const chooserLocked = (allowedChooser === 'RED' || allowedChooser === 'GREEN');

  title.textContent = `Period ${choiceUI.pendingPeriod} — Choice`;

  if (!choiceUI.chooser) {
    sub.textContent = `Select the coin-flip winner (Red or Green)`;
  } else {
    sub.textContent = `${choiceUI.chooser === 'RED' ? 'Red' : 'Green'} has the choice`;
  }

  chooserRed.classList.toggle('active', choiceUI.chooser === 'RED');
  chooserGreen.classList.toggle('active', choiceUI.chooser === 'GREEN');

  // Lock chooser if rules dictate it (e.g., opposite color next period, or owed choice after defer)
  chooserRed.disabled = chooserLocked && allowedChooser !== 'RED';
  chooserGreen.disabled = chooserLocked && allowedChooser !== 'GREEN';

  // Can't choose position until a chooser is selected
  const chooserSelected = (choiceUI.chooser === 'RED' || choiceUI.chooser === 'GREEN');
  btnNeutral.disabled = !chooserSelected;
  btnTop.disabled = !chooserSelected;
  btnBottom.disabled = !chooserSelected;

  // Defer rules:
  // - Defer can only be used once per wrestler
  // - If someone deferred earlier, they are owed the next choice and cannot defer then
  // - At the end of period 2 (choosing for period 3), defer is NOT allowed
  const periodNumber = Number(choiceUI.pendingPeriod ?? 0);
  const isChoosingForPeriod3 = (periodNumber === 3);

  const chooserOwedChoice = chooserSelected && (choiceUI.deferredColor === choiceUI.chooser);
  const deferUsed = chooserSelected && !!choiceUI.deferUsedByColor[choiceUI.chooser];

  const deferAllowed =
    chooserSelected &&
    !isChoosingForPeriod3 &&
    !chooserOwedChoice &&
    !deferUsed;

  deferBtn.disabled = !deferAllowed;
  deferBtn.title = deferAllowed
    ? ''
    : (!chooserSelected
        ? 'Select Red or Green first'
        : (isChoosingForPeriod3
            ? 'Defer not allowed after Period 2'
            : (chooserOwedChoice
                ? 'Cannot defer after deferring earlier'
                : 'Defer already used')));

  note.className = deferAllowed ? 'ms-modal-note' : 'ms-modal-note warn';
  if (!chooserSelected) {
    note.textContent = 'Select Red or Green, then choose Neutral, Top, Bottom (or Defer if allowed).';
  } else if (deferAllowed) {
    note.textContent = 'Select Neutral, Top, Bottom, or Defer.';
  } else {
    note.textContent = isChoosingForPeriod3
      ? 'Defer not available — select Neutral, Top, or Bottom.'
      : (chooserOwedChoice
          ? 'Defer not available — you already deferred earlier.'
          : (deferUsed
              ? 'Defer already used — select Neutral, Top, or Bottom.'
              : 'Select Neutral, Top, or Bottom.'));
  }
}

function applyChoice(choice) {
  const period = choiceUI.pendingPeriod;
  const chooser = choiceUI.chooser;

  if (!period) return;

  // Defer: pass choice immediately; deferer is owed next choice and cannot defer again
  if (choice === 'DEFER') {
    if (choiceUI.deferUsedByColor[chooser]) return;

    choiceUI.deferUsedByColor[chooser] = true;
    choiceUI.deferredColor = chooser;

    // Opponent chooses for THIS period
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

  
  // Track who actually made the choice for this period
  choiceUI.lastChoiceColor = chooser;
  // If this chooser was owed a choice due to a previous defer, clear the debt now
  if (choiceUI.deferredColor === chooser) {
    choiceUI.deferredColor = null;
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
    renderMatQueue(bout);
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
      endPeriodConfirm.disabled = choicePendingNow;

      const resetConfirm = doubleTapConfirmBtn(
        'Reset Match',
        'Tap again to RESET MATCH',
        resetMatch,
        2500
      );
      resetConfirm.disabled = choicePendingNow;

      moreCard.append(endPeriodConfirm, resetConfirm);
      panel.append(moreCard);
    }

    renderMatQueue(bout);
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
    renderMatQueue(bout);
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
  _desiredRunningUntil = 0;
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
  const ok = await rpc('rpc_end_period');
  if (!ok) return;

  // Ensure clock is stopped while transitioning / choosing
  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = 0;
  stopClockTicker();

  // Fetch fresh state (cached _lastBout may be pre-period-advance)
  const bout = await fetchBout();
  if (!bout) return;

  _lastBout = bout;
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


async function resetMatch() {
  const ok = confirm('Reset match? This will set score to 0–0, clock to 2:00, and period to 1. (Actions will be voided.)');
  if (!ok) return;

  // UI local resets
  _moreOpen = false;
  if (typeof _autoEndInFlight !== 'undefined') _autoEndInFlight = false;
  if (typeof _autoEndFiredKey !== 'undefined') _autoEndFiredKey = null;

  // Reset choice UI memory
  choiceUI.isOpen = false;
  choiceUI.pendingPeriod = null;
  choiceUI.chooser = null;
  choiceUI.deferUsedByColor = { RED: false, GREEN: false };
  choiceUI.deferredColor = null;
  choiceUI.lastChoiceColor = null;
  choiceUI.positionOverrideByPeriod = {};
  choiceUI.rideByPeriod = {};

  closeChoiceModal?.(); // if available

  // Reset local clock view immediately (backend is source of truth)
  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = 0;
  _clockBaseMs = 120000;
  stopClockTicker();
  updateClockDisplay();

  await rpc('rpc_reset_match');
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

  // Only during an in-progress bout and active/paused period
  if (boutState !== 'BOUT_IN_PROGRESS' || period == null) return;
  if (!['PERIOD_ACTIVE','PERIOD_PAUSED'].includes(periodState)) return;

  const key = `${BOUT_ID}:${period}`;
  if (_autoEndInFlight) return;
  if (_autoEndFiredKey === key) return;

  _autoEndInFlight = true;

  // Freeze UI at 0 immediately
  _clockRunning = false;
  _desiredRunning = false;
  _desiredRunningUntil = 0;
  _clockBaseMs = 0;

  stopClockTicker();
  const el = document.getElementById('clockDisplay');
  if (el) el.textContent = '00:00.0';

  (async () => {
    try {
      const ok = await rpc('rpc_end_period');
      if (!ok) {
        console.warn('auto-end: rpc_end_period failed; use More → End Period.');
        return;
      }

      _autoEndFiredKey = key;

      // Refresh + open choice for the next period
      const bout = await fetchBout();
      if (!bout) return;

      _lastBout = bout;
      renderHeader(bout);
      syncClockFromBout(bout);
      renderStateBanner(bout, bout.actions || []);
      renderActions(bout);

      if (bout.state === 'BOUT_IN_PROGRESS') {
        openChoiceModal(bout.current_period);
      }
    } catch (e) {
      console.error('auto-endPeriod error:', e);
    } finally {
      _autoEndInFlight = false;
    }
  })();
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
  let effectiveRunning = serverRunning || (inGrace && _desiredRunning === true);

  // Never run the clock unless the period is active/paused
  if (!['PERIOD_ACTIVE','PERIOD_PAUSED'].includes(bout.period_state)) {
    effectiveRunning = false;
  }

  // If backend isn't authoritative yet, NEVER let refresh reset the clock upward
  // during the SAME period. (This prevents the "stop clock -> resets to 2:00" bug.)
  const samePeriod =
    (_lastBout?.state === 'BOUT_IN_PROGRESS') &&
    (bout.state === 'BOUT_IN_PROGRESS') &&
    (Number(bout.current_period) === Number(_lastBout?.current_period));

  if (samePeriod && localRemaining > 0 && serverMs > localRemaining + 500) {
    serverMs = localRemaining;
  }

  if (effectiveRunning) {
    if (serverMs <= 0) {
      // backend not tracking remaining; keep local if we have it, else init from defaults
      serverMs = (localRemaining > 0)
        ? localRemaining
        : (PERIOD_LENGTH_MS[bout.current_period] ?? 0);
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
