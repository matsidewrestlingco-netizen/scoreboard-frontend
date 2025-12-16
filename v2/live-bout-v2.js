// ===============================
// CONFIG
// ===============================
const BOUT_ID = '93c1b3b2-e2d0-4b77-9582-c2bed2099d05';

// ===============================
// SUPABASE CLIENT
// ===============================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://polfteqwekkhzlhfjhsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZ0ZXF3ZWtraHpsaGZqaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTU2MzAsImV4cCI6MjA4MDY5MTYzMH0.npJCJJKOLTQddFH-xtU_ZtlT9_M8JWWpScDIsZAGY4M'
);

// ===============================
// DATA FETCH
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

  // Clear panel
  panel.innerHTML = '';

  // BOUT_READY → Start Match
  if (bout.state === 'BOUT_READY') {
    const btn = document.createElement('button');
    btn.className = 'primary';
    btn.textContent = 'Start Match';
    btn.onclick = startMatch;

    panel.appendChild(btn);
    return;
  }

    // BOUT_IN_PROGRESS → scoring
    if (bout.state === 'BOUT_IN_PROGRESS') {
    const panel = document.getElementById('actionPanel');
    panel.innerHTML = '';
  
    const btn = document.createElement('button');
    btn.className = 'secondary';
    btn.textContent = 'TD Red +3';
    btn.onclick = () => score('RED', 3);
  
    panel.appendChild(btn);
    return;
  }

    if (bout.state === 'BOUT_IN_PROGRESS') {
    const panel = document.getElementById('actionPanel');
    panel.innerHTML = '';
  
    const tdBtn = document.createElement('button');
    tdBtn.className = 'secondary';
    tdBtn.textContent = 'TD Red +3';
    tdBtn.onclick = () => score('RED', 3);
  
    const undoBtn = document.createElement('button');
    undoBtn.className = 'danger';
    undoBtn.textContent = 'Undo Last Action';
    undoBtn.onclick = undoLastAction;
  
    panel.appendChild(tdBtn);
    panel.appendChild(undoBtn);
    return;
  }
  
  // All other states (for now)
  panel.innerHTML = `<div class="muted">No actions available</div>`;
}

// ===============================
// ACTIONS
// ===============================
  async function startMatch() {
    const { error } = await supabase.rpc('rpc_bout_start', {
      p_bout_id: BOUT_ID,
      p_actor_id: crypto.randomUUID()
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

// Initial load
refresh();
