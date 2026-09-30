// Coordinates describe the walkable floor in the generated 1000 × 667 world.
// Keep the rack, cage, desk and wall footprints outside these regions.
export const FLOOR = [
  [110, 315, 880, 550],
  [80, 365, 920, 490],
  [115, 300, 365, 335],
  [450, 190, 550, 335],
  [720, 270, 875, 335],
  [460, 535, 540, 620],
];
export const STOPS = {
  liners: { x: 170, y: 310, label: 'Rainbow storage racks', facing: 3 },
  stowguidance: { x: 500, y: 240, label: 'Stow satellite', facing: 3 },
  portal: { x: 800, y: 300, label: "Manager's desk", facing: 3 },
  beams: { x: 360, y: 510, label: 'Floor-level pallet pick', facing: 1 },
  ai: { x: 600, y: 450, label: 'Leadership sync area', facing: 2 },
};
export const EXIT = { x: 500, y: 600 };
export const START = { x: 500, y: 510 };
export const BLOCKED = [[105, 325, 335, 518], [625, 305, 865, 500]];
export function walkable(x, y) {
  return FLOOR.some(([left, top, right, bottom]) => x >= left && x <= right && y >= top && y <= bottom)
    && !BLOCKED.some(([left, top, right, bottom]) => x >= left && x <= right && y >= top && y <= bottom);
}
const COLS = 101, ROWS = 67, UNIT = 10;
const point = i => ({ x: (i % COLS) * UNIT, y: Math.floor(i / COLS) * UNIT });
const openCells = [];
for (let i = 0; i < COLS * ROWS; i++) {
  const p = point(i);
  if (walkable(p.x, p.y)) openCells.push(i);
}
const openSet = new Set(openCells);
export function nearestFloor(target) {
  let best = openCells[0], distance = Infinity;
  for (const i of openCells) {
    const p = point(i), d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
    if (d < distance) { best = i; distance = d; }
  }
  return point(best);
}
export function findPath(from, to) {
  const start = nearestFloor(from), goal = nearestFloor(to);
  const startId = start.y / UNIT * COLS + start.x / UNIT;
  const goalId = goal.y / UNIT * COLS + goal.x / UNIT;
  const queue = [startId], previous = new Map([[startId, null]]);
  for (let head = 0; head < queue.length && !previous.has(goalId); head++) {
    const current = queue[head];
    for (const next of [current - COLS, current + COLS, current - 1, current + 1]) {
      if (!openSet.has(next) || previous.has(next)) continue;
      const a = point(current), b = point(next);
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== UNIT) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }
  if (!previous.has(goalId)) return [];
  const route = [];
  for (let i = goalId; i !== null; i = previous.get(i)) route.push(point(i));
  route.reverse();
  // Retain only corners; each segment still follows verified adjacent floor cells.
  return route.filter((p, i) => i === 0 || i === route.length - 1 ||
    (p.x - route[i - 1].x) * (route[i + 1].y - p.y) !==
    (p.y - route[i - 1].y) * (route[i + 1].x - p.x));
}
