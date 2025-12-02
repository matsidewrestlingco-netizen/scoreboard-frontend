// modules/logic/ot-engine.js
// -------------------------------------------------------
// Overtime segment progression logic
// -------------------------------------------------------

export const SEGMENTS = {
  P1: { name: "Period 1", next: "P2", time: 60 },
  P2: { name: "Period 2", next: "P3", time: 60 },
  P3: { name: "Period 3", next: "OT", time: 60 },
  OT: { name: "OT", next: "TB1", time: 60 },
  TB1: { name: "TB1", next: "TB2", time: 30 },
  TB2: { name: "TB2", next: "UT", time: 30 },
  UT: { name: "Ultimate", next: null, time: 30 }
};

export function nextSegment(segId) {
  const seg = SEGMENTS[segId];
  return seg?.next || null;
}
