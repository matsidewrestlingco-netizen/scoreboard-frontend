// modules/periodLogic.js

// ---------------------------------------------------------------------------
// MATCH SEGMENT DEFINITIONS
// ---------------------------------------------------------------------------
// All times in SECONDS
export const PERIODS = [
  { id: "REG1", label: "1", time: 60 },
  { id: "REG2", label: "2", time: 60 },
  { id: "REG3", label: "3", time: 60 }
];

export const OVERTIME = [
  { id: "OT", label: "OT", time: 60 },
  { id: "TB1", label: "TB1", time: 30 },
  { id: "TB2", label: "TB2", time: 30 },
  { id: "UT", label: "UT", time: 30 }
];

// Full ordered chain:
const CHAIN = [...PERIODS, ...OVERTIME];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
export function getSegmentById(id) {
  return CHAIN.find(s => s.id === id);
}

export function getInitialSegment() {
  return PERIODS[0];
}

export function shouldAutoEndMatch(red, green, segId) {
  // Tech fall (15 point differential) applies only before UT
  if (segId !== "UT" && Math.abs(red - green) >= 15) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Determine next segment when the timer hits 0
// ---------------------------------------------------------------------------
export function getNextSegment(currentId, red, green) {
  const idx = CHAIN.findIndex(s => s.id === currentId);
  if (idx === -1) return getInitialSegment();

  const isTie = red === green;
  const segment = CHAIN[idx];

  // REG1 → REG2 → REG3
  if (segment.id === "REG1") return PERIODS[1];
  if (segment.id === "REG2") return PERIODS[2];

  // REG3 ends:
  if (segment.id === "REG3") {
    if (!isTie) return null; // winner determined
    return OVERTIME[0]; // go to OT
  }

  // OT → TB1 → TB2 → UT
  if (segment.id === "OT") return OVERTIME[1];
  if (segment.id === "TB1") return OVERTIME[2];
  if (segment.id === "TB2") return OVERTIME[3];

  // UT ends match always — winner must be decided externally
  if (segment.id === "UT") {
    return null;
  }

  return null;
}
