// Sizzle & Serve — Rush Hour Kitchen: tuning constants and layout geometry.
// One canvas, 1280x720, drawn fresh every frame; every number the game balances
// on lives here so the world and the renderer agree on sizes and positions.
export const VIEW = { width: 1280, height: 720 };

export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const ORDER_SPAWN_SECONDS = 8;
export const ORDER_PATIENCE_SECONDS = 58;
export const MAX_HEARTS = 3;
export const GRILL_SLOTS = 2;
export const FRYER_SLOTS = 2;
export const PLATES = 3;
export const PLATE_CAPACITY = 4;
export const TIP_MAX_SECONDS = 20;

// Layout: header, then order board (left) + serving pass (right), stations
// (middle), ingredient counter (bottom).
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 62 },
  board: { x: 16, y: 74, w: 316, h: 330 },
  pass: { x: 964, y: 74, w: 300, h: 330 },
  grill: { x: 348, y: 74, w: 300, h: 158 },
  fryer: { x: 348, y: 246, w: 300, h: 158 },
  counter: { x: 16, y: 420, w: 1248, h: 284 },
  hand: { x: 664, y: 74, w: 284, h: 330 },
};

export const BEST_KEY = 'sizzle-and-serve-best-coins';

// Warm diner palette: cream walls, terracotta tile, steel stations, wood counter.
export const COLORS = {
  wall: '#f7e8c9',
  wallShadow: '#ecd9ae',
  floor: '#c96f4a',
  floorDark: '#b85f3c',
  header: '#3b2a1e',
  headerText: '#ffe9b8',
  board: '#fff8e7',
  boardEdge: '#8a5a2b',
  ticket: '#fffdf5',
  ticketEdge: '#d8c49a',
  ticketUrgent: '#e4572e',
  steel: '#b9c0c7',
  steelDark: '#8d969e',
  steelLight: '#dfe5ea',
  counterTop: '#a06a35',
  counterFront: '#7d4f24',
  counterEdge: '#5d3a18',
  plate: '#fdfdfd',
  plateEdge: '#c9c2b4',
  text: '#2e2118',
  muted: '#7a6a58',
  gold: '#f2b705',
  green: '#4caf50',
  red: '#e4572e',
  cream: '#fff3d6',
};

export const KEYS = {
  pause: ['p', 'P', 'Escape'],
  mute: ['m', 'M'],
  restart: ['r', 'R'],
  confirm: ['Enter', ' '],
};
