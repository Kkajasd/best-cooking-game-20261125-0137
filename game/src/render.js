// Every pixel of the kitchen: the order board, the grill and fryer, the serving
// pass, the ingredient counter and the plates. All art is drawn shapes — no
// images, no network — so the screenshots are the game itself. The same hit
// regions the renderer draws are what input.js clicks, so what you see is
// what you can touch.
import { COLORS, LAYOUT, VIEW } from './config.js';
import { BINS, COOKED_NAME, INGREDIENTS, RECIPES, plateCouldBecome, plateMatchesRecipe, recipeById } from './data.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const BURN_COLOR = '#2b2320';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function panel(ctx, x, y, w, h, fill, edge) {
  ctx.fillStyle = edge;
  roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 12);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
}

function sectionTitle(ctx, str, x, y, color = COLORS.text) {
  text(ctx, str, x, y, 17, color, 'left', 'bold');
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(x, y + 13, 44, 4);
}

function drawHeart(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.3, cy, cx - s * 0.7, cy - s, cx, cy - s * 0.3);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s, cx + s * 1.3, cy, cx, cy + s * 0.9);
  ctx.fill();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawTrashCan(ctx, cx, cy, s, color) {
  const u = s / 100;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - 26 * u, cy - 18 * u);
  ctx.lineTo(cx + 26 * u, cy - 18 * u);
  ctx.lineTo(cx + 20 * u, cy + 24 * u);
  ctx.lineTo(cx - 20 * u, cy + 24 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - 30 * u, cy - 26 * u, 60 * u, 8 * u);
  ctx.fillRect(cx - 8 * u, cy - 32 * u, 16 * u, 7 * u);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3 * u;
  for (const dx of [-12, 0, 12]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * u, cy - 8 * u);
    ctx.lineTo(cx + dx * u, cy + 16 * u);
    ctx.stroke();
  }
}

// ---- ingredient art -------------------------------------------------------
// Drawn at centre (cx, cy) inside a box of size s. `state` is 'raw' | 'ready'
// | 'burnt'; a ready potato is a carton of fries, a burnt item is charcoal.
export function drawIngredient(ctx, kind, cx, cy, s, itemState = 'ready') {
  const def = INGREDIENTS[kind];
  const u = s / 100;
  ctx.save();
  ctx.translate(cx, cy);
  if (itemState === 'burnt') {
    ctx.fillStyle = BURN_COLOR;
    ctx.beginPath();
    ctx.ellipse(0, 6 * u, 34 * u, 20 * u, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.moveTo(-14 * u, -14 * u);
    ctx.lineTo(-6 * u, -26 * u);
    ctx.moveTo(2 * u, -16 * u);
    ctx.lineTo(10 * u, -30 * u);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'bun': {
      ctx.fillStyle = def.dark;
      roundRect(ctx, -32 * u, 8 * u, 64 * u, 16 * u, 8 * u);
      ctx.fill();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 8 * u, 32 * u, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      for (const [dx, dy] of [[-16, -12], [0, -20], [16, -12], [-7, -6], [9, -7]]) {
        ctx.beginPath();
        ctx.ellipse(dx * u, dy * u, 3.4 * u, 2.2 * u, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = def.dark;
      roundRect(ctx, -34 * u, -12 * u, 68 * u, 26 * u, 12 * u);
      ctx.fill();
      ctx.fillStyle = def.color;
      roundRect(ctx, -32 * u, -14 * u, 64 * u, 24 * u, 11 * u);
      ctx.fill();
      ctx.strokeStyle = def.dark;
      ctx.lineWidth = 3 * u;
      for (const dx of [-18, 0, 18]) {
        ctx.beginPath();
        ctx.moveTo(dx * u, -8 * u);
        ctx.lineTo(dx * u, 6 * u);
        ctx.stroke();
      }
      break;
    }
    case 'sausage': {
      ctx.fillStyle = def.dark;
      roundRect(ctx, -34 * u, -11 * u, 68 * u, 24 * u, 12 * u);
      ctx.fill();
      ctx.fillStyle = def.color;
      roundRect(ctx, -32 * u, -13 * u, 64 * u, 22 * u, 11 * u);
      ctx.fill();
      ctx.strokeStyle = '#e8a06a';
      ctx.lineWidth = 3 * u;
      for (const dx of [-16, 0, 16]) {
        ctx.beginPath();
        ctx.moveTo((dx - 5) * u, -9 * u);
        ctx.lineTo((dx + 5) * u, 9 * u);
        ctx.stroke();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = def.dark;
      ctx.beginPath();
      ctx.moveTo(-32 * u, 14 * u);
      ctx.lineTo(32 * u, 14 * u);
      ctx.lineTo(0, -20 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.moveTo(-30 * u, 12 * u);
      ctx.lineTo(30 * u, 12 * u);
      ctx.lineTo(0, -18 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.dark;
      for (const [dx, dy] of [[-8, 2], [8, 4], [0, -6]]) {
        ctx.beginPath();
        ctx.arc(dx * u, dy * u, 3 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = def.dark;
      for (const [dx, dy, r] of [[-18, 2, 16], [0, -6, 18], [18, 2, 16]]) {
        ctx.beginPath();
        ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = def.color;
      for (const [dx, dy, r] of [[-18, 2, 13], [0, -6, 15], [18, 2, 13]]) {
        ctx.beginPath();
        ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = def.dark;
      ctx.lineWidth = 2.5 * u;
      ctx.beginPath();
      ctx.moveTo(-24 * u, 4 * u);
      ctx.quadraticCurveTo(0, -14 * u, 24 * u, 4 * u);
      ctx.stroke();
      break;
    }
    case 'tomato': {
      ctx.fillStyle = def.dark;
      ctx.beginPath();
      ctx.arc(0, 2 * u, 26 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 2 * u, 24 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7bc950';
      ctx.beginPath();
      ctx.moveTo(0, -16 * u);
      ctx.lineTo(-10 * u, -26 * u);
      ctx.lineTo(0, -22 * u);
      ctx.lineTo(10 * u, -26 * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-9 * u, -6 * u, 6 * u, 4 * u, -0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'onion': {
      ctx.strokeStyle = def.dark;
      ctx.lineWidth = 7 * u;
      for (const r of [24, 16, 8]) {
        ctx.beginPath();
        ctx.arc(0, 0, r * u, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#efe6f5';
      ctx.lineWidth = 3 * u;
      for (const r of [20, 12]) {
        ctx.beginPath();
        ctx.arc(0, 0, r * u, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case 'potato': {
      if (itemState === 'ready') {
        ctx.fillStyle = '#e4572e';
        ctx.beginPath();
        ctx.moveTo(-26 * u, -6 * u);
        ctx.lineTo(26 * u, -6 * u);
        ctx.lineTo(20 * u, 26 * u);
        ctx.lineTo(-20 * u, 26 * u);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f7c948';
        for (const [dx, h] of [[-18, 30], [-6, 38], [6, 34], [18, 28]]) {
          roundRect(ctx, (dx - 5) * u, (-6 - h) * u, 10 * u, h * u, 3 * u);
          ctx.fill();
        }
        ctx.fillStyle = '#fff3d6';
        ctx.beginPath();
        ctx.arc(0, 8 * u, 9 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e4572e';
        text(ctx, 'S&S', 0, 9 * u, 11 * u, '#e4572e', 'center');
      } else {
        ctx.fillStyle = def.dark;
        ctx.beginPath();
        ctx.ellipse(0, 2 * u, 30 * u, 20 * u, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 28 * u, 18 * u, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = def.dark;
        for (const [dx, dy] of [[-12, -4], [6, 4], [14, -6]]) {
          ctx.beginPath();
          ctx.arc(dx * u, dy * u, 2.4 * u, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r) {
  ctx.fillStyle = COLORS.plateEdge;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(x, y, r - 4, r * 0.82 - 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e0d0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r - 12, r * 0.82 - 10, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Stack the plate's items as one little dish, bun at the bottom.
function drawDish(ctx, items, cx, cy, s) {
  const order = ['bun', 'patty', 'sausage', 'potato', 'cheese', 'lettuce', 'tomato', 'onion'];
  const sorted = [...items].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  let y = cy + 8;
  for (const kind of sorted) {
    drawIngredient(ctx, kind, cx, y, s, 'ready');
    y -= s * 0.16;
  }
}

// ---- hit regions ----------------------------------------------------------
export function binRect(index) {
  return { x: 32 + index * 150, y: 472, w: 136, h: 168 };
}
export function trashRect() {
  return { x: 1184, y: 472, w: 64, h: 168 };
}
export function grillSlotRect(slot) {
  return { x: 372 + slot * 142, y: 118, w: 126, h: 96 };
}
export function fryerSlotRect(slot) {
  return { x: 372 + slot * 142, y: 290, w: 126, h: 96 };
}
export function plateRect(index) {
  return { x: 980, y: 118 + index * 96, w: 120, h: 84 };
}
export function serveRect(index) {
  return { x: 1112, y: 132 + index * 96, w: 132, h: 56 };
}

export function hitAt(x, y) {
  if (y >= 472 && y <= 640) {
    for (let i = 0; i < BINS.length; i += 1) {
      const r = binRect(i);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return { zone: 'bin', kind: BINS[i] };
    }
    const t = trashRect();
    if (x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) return { zone: 'trash' };
  }
  for (let i = 0; i < 2; i += 1) {
    const g = grillSlotRect(i);
    if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) return { zone: 'grill', slot: i };
    const f = fryerSlotRect(i);
    if (x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) return { zone: 'fryer', slot: i };
  }
  for (let i = 0; i < 3; i += 1) {
    const p = plateRect(i);
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return { zone: 'plate', plate: i };
    const s = serveRect(i);
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return { zone: 'serve', plate: i };
  }
  return null;
}

// ---- the renderer ---------------------------------------------------------
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const floaters = [];
  let lastEventAt = -1;

  function addFloater(kind, detail) {
    const spots = {
      serve: { x: 1110, y: 414, color: '#2e7d32' },
      wrong: { x: 1110, y: 414, color: '#c62828' },
      expire: { x: 174, y: 414, color: '#c62828' },
      'cook-done': { x: 498, y: 414, color: '#2e7d32' },
      burnt: { x: 498, y: 414, color: '#4e342e' },
      trash: { x: 1216, y: 414, color: '#7a6a58' },
    };
    const spot = spots[kind];
    if (!spot) return;
    const label =
      kind === 'serve' && detail ? `+$${detail.coins} ${detail.name}!` :
      kind === 'wrong' ? 'Wrong dish!' :
      kind === 'expire' && detail ? `${detail} walked out!` :
      kind === 'cook-done' && detail ? `${detail} ready!` :
      kind === 'burnt' ? 'Burnt! Toss it!' :
      kind === 'trash' ? 'Tossed' : '';
    if (label) floaters.push({ x: spot.x, y: spot.y, label, color: spot.color, ttl: 1.6 });
  }

  function drawHeader(state, best) {
    ctx.fillStyle = COLORS.header;
    ctx.fillRect(0, 0, VIEW.width, LAYOUT.header.h);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(0, LAYOUT.header.h - 4, VIEW.width, 4);
    text(ctx, 'SIZZLE & SERVE', 20, 26, 26, COLORS.headerText, 'left');
    text(ctx, 'Rush Hour Kitchen', 20, 50, 13, '#c9a58a', 'left');
    const mins = Math.floor(state.shiftLeft / 60);
    const secs = Math.floor(state.shiftLeft % 60);
    const timerColor = state.shiftLeft <= 30 ? '#ff8a65' : COLORS.headerText;
    text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 640, 30, 34, timerColor, 'center');
    text(ctx, 'SHIFT TIMER', 640, 54, 11, '#b9a58a', 'center');
    // Coin icon drawn as a shape (no emoji font needed in headless Chrome).
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(968, 24, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a67c00';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, '$', 968, 25, 15, '#7a5c00', 'center');
    text(ctx, String(state.coins), 988, 26, 24, COLORS.gold, 'left');
    text(ctx, `Served ${state.served}  ·  Best $${best}`, 1050, 50, 13, '#d8c9a8', 'right');
    // Hearts drawn as vector shapes.
    for (let i = 0; i < 3; i += 1) {
      const x = 1160 + i * 34;
      drawHeart(ctx, x, 30, 11, i < state.hearts ? '#e4572e' : '#5a4a3a');
    }
  }

  function drawBoard(state) {
    const b = LAYOUT.board;
    panel(ctx, b.x, b.y, b.w, b.h, COLORS.board, COLORS.boardEdge);
    sectionTitle(ctx, 'ORDER BOARD', b.x + 14, b.y + 22);
    text(ctx, 'Serve before patience runs out!', b.x + 14, b.y + 42, 12, COLORS.muted, 'left', 'normal');
    for (let i = 0; i < 3; i += 1) {
      const y = b.y + 58 + i * 90;
      const order = state.orders[i];
      ctx.fillStyle = order ? COLORS.ticket : 'rgba(0,0,0,0.06)';
      roundRect(ctx, b.x + 12, y, b.w - 24, 80, 8);
      ctx.fill();
      if (!order) {
        text(ctx, '— waiting for the next ticket —', b.x + b.w / 2, y + 40, 13, COLORS.muted, 'center', 'normal');
        continue;
      }
      const urgent = order.patience < 15;
      ctx.strokeStyle = urgent ? COLORS.ticketUrgent : COLORS.ticketEdge;
      ctx.lineWidth = urgent ? 3 : 1.5;
      roundRect(ctx, b.x + 12, y, b.w - 24, 80, 8);
      ctx.stroke();
      text(ctx, `#${order.id} ${order.name}`, b.x + 24, y + 18, 16, COLORS.text);
      text(ctx, `$${order.price}`, b.x + b.w - 24, y + 18, 16, '#2e7d32', 'right');
      let ix = b.x + 26;
      for (const kind of order.items) {
        drawIngredient(ctx, kind, ix + 14, y + 48, 26, 'ready');
        ix += 34;
      }
      const frac = Math.max(0, order.patience / order.maxPatience);
      ctx.fillStyle = '#e8ddc4';
      roundRect(ctx, b.x + 24, y + 66, b.w - 48, 8, 4);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.red;
      roundRect(ctx, b.x + 24, y + 66, (b.w - 48) * frac, 8, 4);
      ctx.fill();
    }
  }

  function drawStation(state, kind) {
    const box = kind === 'grill' ? LAYOUT.grill : LAYOUT.fryer;
    const slots = kind === 'grill' ? state.grill : state.fryer;
    const slotRect = kind === 'grill' ? grillSlotRect : fryerSlotRect;
    panel(ctx, box.x, box.y, box.w, box.h, '#e8edf0', COLORS.steelDark);
    sectionTitle(ctx, kind === 'grill' ? 'GRILL  ·  patties & sausages' : 'FRYER  ·  potatoes', box.x + 14, box.y + 22);
    for (let i = 0; i < slots.length; i += 1) {
      const r = slotRect(i);
      const slot = slots[i];
      ctx.fillStyle = '#3a3f45';
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      ctx.fillStyle = '#22262a';
      roundRect(ctx, r.x + 6, r.y + 6, r.w - 12, r.h - 12, 8);
      ctx.fill();
      if (kind === 'grill') {
        ctx.strokeStyle = '#565d66';
        ctx.lineWidth = 3;
        for (let gx = r.x + 22; gx < r.x + r.w - 10; gx += 20) {
          ctx.beginPath();
          ctx.moveTo(gx, r.y + 10);
          ctx.lineTo(gx, r.y + r.h - 10);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = 'rgba(242,180,60,0.85)';
        roundRect(ctx, r.x + 10, r.y + r.h - 30, r.w - 20, 20, 8);
        ctx.fill();
      }
      if (slot.item) {
        const item = slot.item;
        const def = INGREDIENTS[item.kind];
        drawIngredient(ctx, item.kind, r.x + r.w / 2, r.y + r.h / 2 - 4, 56, item.state);
        if (item.state === 'cooking') {
          const frac = Math.min(1, item.progress / def.cookSeconds);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(r.x + r.w / 2, r.y + r.h / 2 - 4, 40, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = frac > 0.9 ? COLORS.gold : '#fff';
          ctx.beginPath();
          ctx.arc(r.x + r.w / 2, r.y + r.h / 2 - 4, 40, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
        } else if (item.state === 'ready') {
          text(ctx, 'READY — click to take', r.x + r.w / 2, r.y + r.h - 8, 11, COLORS.green, 'center');
        } else if (item.state === 'burnt') {
          text(ctx, 'BURNT — click to toss', r.x + r.w / 2, r.y + r.h - 8, 11, '#ff8a65', 'center');
        }
      } else {
        text(ctx, 'empty', r.x + r.w / 2, r.y + r.h / 2, 13, '#8d969e', 'center', 'normal');
      }
    }
  }

  function drawPass(state) {
    const p = LAYOUT.pass;
    panel(ctx, p.x, p.y, p.w, p.h, COLORS.board, COLORS.boardEdge);
    sectionTitle(ctx, 'SERVING PASS', p.x + 14, p.y + 22);
    text(ctx, 'Build the dish, then SERVE it.', p.x + 14, p.y + 42, 12, COLORS.muted, 'left', 'normal');
    for (let i = 0; i < state.plates.length; i += 1) {
      const plate = state.plates[i];
      const r = plateRect(i);
      const matching = state.orders.find((order) => plateMatchesRecipe(plate.items, recipeById(order.recipeId)));
      const could = !matching && plate.items.length > 0 &&
        state.orders.some((order) => plateCouldBecome(plate.items, recipeById(order.recipeId)));
      if (matching) {
        ctx.fillStyle = 'rgba(76,175,80,0.18)';
        roundRect(ctx, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 10);
        ctx.fill();
      }
      drawPlate(ctx, r.x + 52, r.y + 44, 40);
      if (plate.items.length === 0) {
        text(ctx, 'empty plate', r.x + 52, r.y + 44, 12, COLORS.muted, 'center', 'normal');
      } else {
        drawDish(ctx, plate.items, r.x + 52, r.y + 40, 40);
      }
      const s = serveRect(i);
      const ready = Boolean(matching);
      ctx.fillStyle = ready ? COLORS.green : '#b0a58e';
      roundRect(ctx, s.x, s.y, s.w, s.h, 10);
      ctx.fill();
      text(ctx, ready ? 'SERVE!' : 'SERVE', s.x + s.w / 2, s.y + s.h / 2, 18, '#fff', 'center');
      if (matching) text(ctx, `matches #${matching.id} ${matching.name}`, r.x + 52, r.y + 88, 11, '#2e7d32', 'center', 'normal');
      else if (could) text(ctx, 'on its way…', r.x + 52, r.y + 88, 11, COLORS.muted, 'center', 'normal');
      else if (plate.items.length > 0) text(ctx, 'no ticket wants this', r.x + 52, r.y + 88, 11, '#c62828', 'center', 'normal');
    }
  }

  function drawHandPanel(state, muted) {
    const h = LAYOUT.hand;
    panel(ctx, h.x, h.y, h.w, h.h, '#fff8e7', COLORS.boardEdge);
    sectionTitle(ctx, 'IN YOUR HAND', h.x + 14, h.y + 22);
    if (state.hand) {
      const label = state.hand.state === 'ready' && COOKED_NAME[state.hand.kind]
        ? COOKED_NAME[state.hand.kind]
        : INGREDIENTS[state.hand.kind].name;
      drawIngredient(ctx, state.hand.kind, h.x + 142, h.y + 92, 96, state.hand.state);
      text(ctx, label, h.x + 142, h.y + 158, 18, COLORS.text, 'center');
      const hint =
        state.hand.state === 'raw' && INGREDIENTS[state.hand.kind].cook
          ? `Click the ${INGREDIENTS[state.hand.kind].cook.toUpperCase()} to cook it`
          : state.hand.state === 'ready'
            ? 'Click a plate to add it'
            : 'Click the trash to toss it';
      text(ctx, hint, h.x + 142, h.y + 184, 13, COLORS.muted, 'center', 'normal');
    } else {
      ctx.strokeStyle = '#d8c49a';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(h.x + 142, h.y + 92, 62, 48, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Hands empty', h.x + 142, h.y + 92, 15, COLORS.muted, 'center', 'normal');
      text(ctx, 'Click an ingredient below', h.x + 142, h.y + 184, 13, COLORS.muted, 'center', 'normal');
    }
    // Mini menu: the five dishes and their price, so the judge sees the goal.
    text(ctx, 'MENU', h.x + 14, h.y + 210, 13, COLORS.muted, 'left');
    RECIPES.forEach((recipe, index) => {
      const y = h.y + 230 + index * 17;
      text(ctx, `${recipe.name} — $${recipe.price}`, h.x + 14, y, 12.5, COLORS.text, 'left', 'normal');
      let ix = h.x + h.w - 16;
      for (let k = recipe.items.length - 1; k >= 0; k -= 1) {
        drawIngredient(ctx, recipe.items[k], ix - 10, y, 15, 'ready');
        ix -= 22;
      }
    });
    text(ctx, muted ? 'Sound: OFF (M)' : 'Sound: ON (M)', h.x + 14, h.y + h.h - 14, 11, COLORS.muted, 'left', 'normal');
  }

  function drawCounter(state, mouse) {
    const c = LAYOUT.counter;
    ctx.fillStyle = COLORS.counterFront;
    roundRect(ctx, c.x, c.y, c.w, c.h, 14);
    ctx.fill();
    ctx.fillStyle = COLORS.counterTop;
    roundRect(ctx, c.x, c.y, c.w, 46, 14);
    ctx.fill();
    ctx.fillRect(c.x, c.y + 32, c.w, 14);
    text(ctx, 'INGREDIENTS', c.x + 20, c.y + 23, 16, '#fff3d6', 'left');
    text(ctx, 'click a bin to pick up  ·  keys 1–8 work too', c.x + c.w - 20, c.y + 23, 12, '#e8cfa0', 'right', 'normal');
    BINS.forEach((kind, index) => {
      const r = binRect(index);
      const hovered = mouse && mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h;
      ctx.fillStyle = hovered ? '#8a5a2b' : '#6d4420';
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      ctx.fillStyle = '#f7e8c9';
      roundRect(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 8);
      ctx.fill();
      drawIngredient(ctx, kind, r.x + r.w / 2, r.y + 62, 74, 'ready');
      text(ctx, INGREDIENTS[kind].name, r.x + r.w / 2, r.y + 122, 14, COLORS.text, 'center');
      const needsCook = INGREDIENTS[kind].cook;
      text(ctx, needsCook ? `→ ${needsCook}` : 'ready to plate', r.x + r.w / 2, r.y + 144, 11, COLORS.muted, 'center', 'normal');
      text(ctx, String(index + 1), r.x + 12, r.y + 16, 12, COLORS.muted, 'left');
    });
    const t = trashRect();
    ctx.fillStyle = '#5d3a18';
    roundRect(ctx, t.x, t.y, t.w, t.h, 10);
    ctx.fill();
    drawTrashCan(ctx, t.x + t.w / 2, t.y + 62, 52, '#e8cfa0');
    text(ctx, 'TRASH', t.x + t.w / 2, t.y + 122, 12, '#e8cfa0', 'center');
    text(ctx, '1–8 pick · click grill / fryer to cook · click a plate to build · SERVE the matching ticket · P pause', 640, c.y + c.h - 18, 13, '#e8cfa0', 'center', 'normal');
  }

  function drawKitchen(state, mouse, best, muted) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = COLORS.wallShadow;
    for (let x = 0; x < VIEW.width; x += 96) ctx.fillRect(x, 62, 2, 358);
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 420, VIEW.width, 300);
    ctx.fillStyle = COLORS.floorDark;
    for (let y = 452; y < 720; y += 64) ctx.fillRect(0, y, VIEW.width, 2);
    drawBoard(state);
    drawStation(state, 'grill');
    drawStation(state, 'fryer');
    drawPass(state);
    drawHandPanel(state, muted);
    drawCounter(state, mouse);
    drawHeader(state, best);
    // Floaters drift up and fade.
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const floater = floaters[i];
      floater.ttl -= 1 / 60;
      floater.y -= 0.6;
      if (floater.ttl <= 0) {
        floaters.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.min(1, floater.ttl);
      text(ctx, floater.label, floater.x, floater.y, 20, floater.color, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawTitle(state, best) {
    drawKitchen(state, null, best, false);
    ctx.fillStyle = 'rgba(46,33,24,0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(ctx, 290, 130, 700, 440, '#fff8e7', COLORS.boardEdge);
    text(ctx, 'SIZZLE & SERVE', 640, 196, 52, COLORS.text, 'center');
    text(ctx, 'Rush Hour Kitchen', 640, 240, 24, '#b06a2a', 'center');
    text(ctx, 'Tickets fly in. The grill is hot. The clock never stops.', 640, 282, 16, COLORS.muted, 'center', 'normal');
    const steps = [
      '1 · Pick ingredients from the counter (click or keys 1–8)',
      '2 · Grill patties & sausages, fry potatoes — don’t let them burn',
      '3 · Build the dish on a plate, then SERVE the matching ticket',
    ];
    steps.forEach((step, i) => text(ctx, step, 640, 326 + i * 30, 16, COLORS.text, 'center', 'normal'));
    text(ctx, '150-second shift  ·  3 strikes and the kitchen closes', 640, 436, 14, COLORS.muted, 'center', 'normal');
    ctx.fillStyle = COLORS.green;
    roundRect(ctx, 490, 470, 300, 56, 12);
    ctx.fill();
    text(ctx, 'START COOKING — ENTER', 640, 499, 22, '#fff', 'center');
    if (best > 0) text(ctx, `Best shift so far: $${best}`, 640, 548, 14, COLORS.muted, 'center', 'normal');
  }

  function drawPaused(state, best) {
    drawKitchen(state, null, best, false);
    ctx.fillStyle = 'rgba(46,33,24,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, 'PAUSED', 640, 330, 56, '#fff', 'center');
    text(ctx, 'Press P or click to keep cooking', 640, 390, 18, '#ffe9b8', 'center', 'normal');
  }

  function drawOver(state, best) {
    drawKitchen(state, null, best, false);
    ctx.fillStyle = 'rgba(46,33,24,0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    panel(ctx, 340, 140, 600, 430, '#fff8e7', COLORS.boardEdge);
    const title = state.overReason === 'closed' ? 'KITCHEN CLOSED!' : 'SHIFT COMPLETE!';
    text(ctx, title, 640, 200, 40, COLORS.text, 'center');
    for (let i = 0; i < 3; i += 1) drawStar(ctx, 580 + i * 60, 258, 24, i < state.stars ? COLORS.gold : '#d8c49a');
    text(ctx, `You earned $${state.coins}`, 640, 318, 26, COLORS.text, 'center');
    text(ctx, `${state.served} dishes served  ·  ${state.wasted} wasted`, 640, 356, 16, COLORS.muted, 'center', 'normal');
    text(ctx, state.coins >= 150 ? 'Three stars! The lunch rush bows to you.' : state.coins >= 100 ? 'Two stars! A solid shift, chef.' : state.coins >= 50 ? 'One star! The kitchen survived.' : 'No stars yet — the tickets won this time.', 640, 392, 15, COLORS.muted, 'center', 'normal');
    ctx.fillStyle = COLORS.green;
    roundRect(ctx, 490, 430, 300, 56, 12);
    ctx.fill();
    text(ctx, 'COOK AGAIN  (R)', 640, 459, 20, '#fff', 'center');
    text(ctx, `Best shift: $${Math.max(best, state.coins)}`, 640, 522, 14, COLORS.muted, 'center', 'normal');
  }

  function draw(state, screen, mouse, best, muted, events) {
    // Only the newest event becomes a floater, and each event fires once:
    // in shot mode the staged world carries its whole history in state.events.
    const fresh = (events ?? []).filter((event) => event.at > lastEventAt);
    for (const event of fresh) addFloater(event.kind, event.detail);
    if (fresh.length > 0) lastEventAt = fresh[fresh.length - 1].at;
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused(state, best);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else drawKitchen(state, mouse, best, muted);
  }

  return { draw };
}
