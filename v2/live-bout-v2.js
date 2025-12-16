const BOUT_ID = '93c1b3b2-e2d0-4b77-9582-c2bed2099d05';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://polfteqwekkhzlhfjhsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGZ0ZXF3ZWtraHpsaGZqaHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTU2MzAsImV4cCI6MjA4MDY5MTYzMH0.npJCJJKOLTQddFH-xtU_ZtlT9_M8JWWpScDIsZAGY4M'
);

async function fetchBout() {
  const { data, error } = await supabase
    .rpc('rpc_get_bout', { p_bout_id: BOUT_ID });

  if (error) {
    console.error(error);
    alert('Failed to fetch bout');
    return null;
  }

  return data;
}

async function refresh() {
  const bout = await fetchBout();
  if (!bout) return;

  document.getElementById('boutHeader').innerHTML = `
    <h2>${bout.red_name} vs ${bout.green_name}</h2>
    <div class="muted">
      Score: ${bout.red_score} – ${bout.green_score}
    </div>
  `;

  document.getElementById('stateBanner').innerHTML = `
    <strong>${bout.state}</strong>
    <div class="muted">
      Period ${bout.current_period} • 
      ${bout.clock_running ? 'Clock Running' : 'Clock Stopped'}
    </div>
  `;

  document.getElementById('actionPanel').innerHTML = `
    <div class="muted">Actions coming next</div>
  `;
}

refresh();
