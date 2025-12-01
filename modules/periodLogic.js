// modules/periodLogic.js

// All times in seconds
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

const CHAIN = [...PERIODS, ...OVERTIME];

export function getSegmentById(id) {
  return CHAIN.find((s) => s.id === id);
}

export function getInitialSegment() {
  return PERIODS[0];
}

export function shouldAutoEndMatch(red, green, segId) {
  const r = red ?? 0;
  const g = green ?? 0;
  if (segId !== "UT" && Math.abs(r - g) >= 15) {
    return true;
  }
  return false;
}

export function getNextSegment(currentId, red, green) {
  const idx = CHAIN.findIndex((s) => s.id === currentId);
  if (idx === -1) return getInitialSegment();

  const isTie = (red ?? 0) === (green ?? 0);
  const segment = CHAIN[idx];

  if (segment.id === "REG1") return PERIODS[1];
  if (segment.id === "REG2") return PERIODS[2];

  if (segment.id === "REG3") {
    if (!isTie) return null;
    return OVERTIME[0];
  }

  if (segment.id === "OT") return OVERTIME[1];
  if (segment.id === "TB1") return OVERTIME[2];
  if (segment.id === "TB2") return OVERTIME[3];

  if (segment.id === "UT") return null;

  return null;
}
