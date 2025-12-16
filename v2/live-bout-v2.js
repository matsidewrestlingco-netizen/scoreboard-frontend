// ===============================
// CONFIG
// ===============================
const BOUT_ID = 'bf27b4ab-f541-453e-98ef-8be5d7863dd2';

// ===============================
// SUPABASE
// ===============================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://polfteqwekkhzlhfjhsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZ0ZXF3ZWtraHpsaGZqaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTU2MzAsImV4cCI6MjA4MDY5MTYzMH0.npJCJJKOLTQddFH-xtU_ZtlT9_M8JWWpScDIsZAGY4M'
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
// RENDER
// ===============================
function renderHeader(bout) {
  document.getElementById('boutHeader').innerHTML = `
    <div class="row">
      <div>
        <h2>${bout.red_name}</h2>
        <div class="muted">RED</div>
      </div>

      <div style="text-align:center;">
        <div style="font-size:28px;">
          ${bout.red_score} – ${bout.green_score}
        </div>
        <div class="muted">Period ${bout.current_period}</div>
      </div>

      <div style="text-align:right;">
        <h2>${bout.green_name}</h2>
        <div class="muted">GREEN</div>
      </div>
    </div>
  `;
}

function renderStateBanner(bout) {
  document.getElementById('stateBanner').innerHTML = `
    <strong>${bout.state}</strong>
    <div class="muted">
      ${bout.clock_running ? 'Clock Running' : 'Clock Stopped'}
    </div>
  `;
}

function renderActions(bout) {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  // -----------------------------
  // BOUT_READY
  // -----------------------------
  if (bout.state === 'BOUT_READY') {
    const startBtn = document.createElement('button');
    startBtn.className = 'primary';
    startBtn.textContent = 'Start Match';
    startBtn.onclick = startMatch;

    panel.appendChild(startBtn);
    return;
  }

// -----------------------------
// BOUT_IN_PROGRESS
// -----------------------------
if (bout.state === 'BOUT_IN_PROGRESS') {
  const panel = document.getElementById('actionPanel');
  panel.innerHTML = '';

  const tdRedBtn = document.createElement('button');
  tdRedBtn.className = 'secondary';
  tdRedBtn.textContent = 'TD Red +3';
  tdRedBtn.onclick = () => score('RED', 3);

  const tdGreenBtn = document.createElement('button');
  tdGreenBtn.className = 'secondary';
  tdGreenBtn.textContent = 'TD Green +3';
  tdGreenBtn.onclick = () => score('GREEN', 3);

  const clockBtn = document.createElement('button');
  clockBtn.className = 'secondary';
  if (bout.clock_running) {
    clockBtn.textContent = 'Stop Clock';
    clockBtn.onclick = clockStop;
  } else {
    clockBtn.textContent = 'Start Clock';
    clockBtn.onclick = clockStart;
  }

  const endPeriodBtn = document.createElement('button');
  endPeriodBtn.className = 'secondary';
  endPeriodBtn.textContent = 'End Period';
  endPeriodBtn.onclick = endPeriod;

  const undoBtn = document.createElement('button');
  undoBtn.className = 'danger';
  undoBtn.textContent = 'Undo Last Action';
  undoBtn.onclick = undoLastAction;

  panel.appendChild(tdRedBtn);
  panel.appendChild(tdGreenBtn);
  panel.appendChild(clockBtn);
  panel.appendChild(endPeriodBtn);
  panel.appendChild(undoBtn);
  return;
}
  // -----------------------------
  // ALL OTHER STATES
  // -----------------------------
  panel.innerHTML = `<div class="muted">No actions available</div>`;
}

// ===============================
// ACTIONS
// ===============================
async function startMatch() {
  const { error } = await supabase.rpc('rpc_bout_start', {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID
  });

  if (error) {
    console.error('startMatch error:', error);
    alert('Failed to start match');
    return;
  }

  await refresh();
}

async function score(color, points) {
  const { error } = await supabase.rpc('rpc_apply_score_action', {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID,
    p_action_type: 'SCORE_TAKEDOWN',
    p_color: color,
    p_points: points
  });

  if (error) {
    console.error('score error:', error);
    alert('Failed to apply score');
    return;
  }

  await refresh();
}

async function undoLastAction() {
  const { error } = await supabase.rpc('rpc_undo_last_action', {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID
  });

  if (error) {
    console.error('undo error:', error);
    alert('Failed to undo last action');
    return;
  }

  await refresh();
}

async function clockStart() {
  const { error } = await supabase.rpc('rpc_clock_action', {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID,
    p_action_type: 'CLOCK_START'
  });

  if (error) {
    console.error('clockStart error:', error);
    alert('Failed to start clock');
    return;
  }

  await refresh();
}

async function clockStop() {
  const { error } = await supabase.rpc('rpc_clock_action', {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID,
    p_action_type: 'CLOCK_STOP'
  });

  if (error) {
    console.error('clockStop error:', error);
    alert('Failed to stop clock');
    return;
  }

  await refresh();
}

async function endPeriod() {
  const { error } = await supabase.rpc('rpc_end_period', {
    p_actor_id: crypto.randomUUID(),
    p_bout_id: BOUT_ID
  });

  if (error) {
    console.error('endPeriod error:', error);
    alert('Failed to end period');
    return;
  }

  await refresh();
}

// ===============================
// REFRESH LOOP
// ===============================
async function refresh() {
  const bout = await fetchBout();
  if (!bout) return;

  renderHeader(bout);
  renderStateBanner(bout);
  renderActions(bout);
}

// INITIAL LOAD
refresh();
