// Staged screenshots that play the real rules: a greedy line cook works the
// kitchen forward from a fresh world for a fixed number of steps, so every
// frame is what a short game really looks like and the same seed always gives
// the same frame. No state is faked — the autopilot only issues the actions a
// player could issue, through the world's own applyAction.
import { STEP } from './config.js';
import { INGREDIENTS, plateCouldBecome, plateMatchesRecipe, recipeById } from './data.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 46;
const END_LIMIT_SECONDS = 600;
const DECIDE_EVERY = 0.8;

/** The first plate that could still become the order, else an empty plate. */
function plateFor(state, order) {
  const recipe = recipeById(order.recipeId);
  for (let i = 0; i < state.plates.length; i += 1) {
    if (plateCouldBecome(state.plates[i].items, recipe)) return i;
  }
  for (let i = 0; i < state.plates.length; i += 1) {
    if (state.plates[i].items.length === 0) return i;
  }
  return -1;
}

function missingItem(state, order, plateIndex) {
  const recipe = recipeById(order.recipeId);
  const pool = [...recipe.items];
  for (const item of state.plates[plateIndex].items) {
    const at = pool.indexOf(item);
    if (at !== -1) pool.splice(at, 1);
  }
  return pool[0] ?? null;
}

function stationWithReady(state, kind) {
  for (const station of ['grill', 'fryer']) {
    const slots = state[station];
    for (let slot = 0; slot < slots.length; slot += 1) {
      const item = slots[slot].item;
      if (item && item.kind === kind && item.state === 'ready') return { station, slot };
    }
  }
  return null;
}

function stationCooking(state, kind) {
  for (const station of ['grill', 'fryer']) {
    for (const slot of state[station]) {
      const item = slot.item;
      if (item && item.kind === kind && item.state === 'cooking') return true;
    }
  }
  return false;
}

function freeSlot(state, station) {
  const slots = state[station];
  for (let slot = 0; slot < slots.length; slot += 1) {
    if (!slots[slot].item) return slot;
  }
  return -1;
}

/** The plate to put `kind` on so it builds toward an open ticket, or -1. */
function plateToBuild(state, kind) {
  for (const order of state.orders) {
    const recipe = recipeById(order.recipeId);
    const plate = plateFor(state, order);
    if (plate !== -1 && plateCouldBecome([...state.plates[plate].items, kind], recipe)) return plate;
  }
  return -1;
}

/** One move for the line cook, or null to wait for the grill. */
function autopilot(state) {
  // Serve any finished dish first — money on the table beats everything.
  for (let i = 0; i < state.plates.length; i += 1) {
    const plate = state.plates[i];
    if (plate.items.length === 0) continue;
    const match = state.orders.find((order) => plateMatchesRecipe(plate.items, recipeById(order.recipeId)));
    if (match) return { type: 'serve', plate: i };
  }
  // A burnt item in hand is trash, never a plate.
  if (state.hand && state.hand.state === 'burnt') return { type: 'trash' };
  // An item in hand goes on the first plate that can still use it.
  if (state.hand && (state.hand.state === 'ready' || state.hand.state === 'raw')) {
    const def = INGREDIENTS[state.hand.kind];
    if (state.hand.state === 'raw' && def.cook) {
      const slot = freeSlot(state, def.cook);
      if (slot !== -1) return { type: 'station', station: def.cook, slot };
      return null;
    }
    const plate = plateToBuild(state, state.hand.kind);
    if (plate !== -1) return { type: 'plate', plate };
    // Nothing wants it right now: park it on the emptiest plate.
    for (let i = 0; i < state.plates.length; i += 1) {
      if (state.plates[i].items.length === 0) return { type: 'plate', plate: i };
    }
    return null;
  }
  // Hands empty: work the oldest ticket first.
  const order = state.orders[0];
  if (!order) return null;
  const plate = plateFor(state, order);
  if (plate === -1) {
    // Every plate is stuck on a dish no ticket wants: scrap the fullest one.
    let worst = 0;
    for (let i = 1; i < state.plates.length; i += 1) {
      if (state.plates[i].items.length > state.plates[worst].items.length) worst = i;
    }
    return { type: 'scrap', plate: worst };
  }
  const kind = missingItem(state, order, plate);
  if (!kind) return null;
  const def = INGREDIENTS[kind];
  if (def.cook) {
    const ready = stationWithReady(state, kind);
    if (ready) return { type: 'station', station: ready.station, slot: ready.slot };
    if (stationCooking(state, kind)) return null;
    return { type: 'bin', kind };
  }
  return { type: 'bin', kind };
}

export function runForward(world, seconds) {
  let sinceDecide = 0;
  for (let t = 0; t < seconds; t += STEP) {
    sinceDecide += STEP;
    const actions = [];
    if (sinceDecide >= DECIDE_EVERY) {
      sinceDecide = 0;
      const action = autopilot(world.state);
      if (action) actions.push(action);
    }
    world.step(STEP, actions);
    if (world.state.over) break;
  }
}

/**
 * Set `world` to the named scene (start, play or end) and return the screen
 * to draw over it and the best score to show. `secondsOverride` stages the
 * play scene at a different moment of the shift (for screenshot tuning).
 */
export function stageShot(name, world, secondsOverride) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    runForward(world, START_SECONDS);
    world.state.events = [];
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runForward(world, secondsOverride ?? PLAY_SECONDS);
    world.state.events = [];
    return { screen: SCREEN_PLAY, best: world.state.coins };
  }
  runForward(world, END_LIMIT_SECONDS);
  world.state.events = [];
  return { screen: SCREEN_OVER, best: world.state.coins };
}
