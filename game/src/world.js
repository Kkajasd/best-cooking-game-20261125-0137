// The kitchen itself: orders, stations, plates and the hand. Pure logic, no DOM
// and no canvas, so the same step() drives live play, the autopilot and a
// headless rehearsal alike. Every player move is one action object.
import {
  FRYER_SLOTS,
  GRILL_SLOTS,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_PATIENCE_SECONDS,
  ORDER_SPAWN_SECONDS,
  PLATES,
  PLATE_CAPACITY,
  SHIFT_SECONDS,
} from './config.js';
import {
  BURN_SECONDS,
  COOKED_NAME,
  INGREDIENTS,
  RECIPES,
  plateMatchesRecipe,
  recipeById,
} from './data.js';

export const EVENT_PICKUP = 'pickup';
export const EVENT_COOK_DONE = 'cook-done';
export const EVENT_BURNT = 'burnt';
export const EVENT_SERVE = 'serve';
export const EVENT_WRONG = 'wrong';
export const EVENT_EXPIRE = 'expire';
export const EVENT_TRASH = 'trash';
export const EVENT_OVER = 'over';

export function createWorld(random) {
  const state = {
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    wasted: 0,
    hearts: MAX_HEARTS,
    over: false,
    overReason: '',
    stars: 0,
    orders: [],
    orderSeq: 0,
    spawnIn: 2,
    grill: Array.from({ length: GRILL_SLOTS }, () => ({ item: null })),
    fryer: Array.from({ length: FRYER_SLOTS }, () => ({ item: null })),
    plates: Array.from({ length: PLATES }, () => ({ items: [] })),
    hand: null,
    events: [],
    servedNames: [],
  };

  function emit(kind, detail) {
    state.events.push({ kind, detail: detail ?? null, at: state.time });
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const recipe = random.pick(RECIPES);
    state.orderSeq += 1;
    state.orders.push({
      id: state.orderSeq,
      recipeId: recipe.id,
      name: recipe.name,
      price: recipe.price,
      items: [...recipe.items],
      patience: ORDER_PATIENCE_SECONDS,
      maxPatience: ORDER_PATIENCE_SECONDS,
    });
  }

  function stationSlots(station) {
    return station === 'grill' ? state.grill : state.fryer;
  }

  function cookableInHand() {
    if (!state.hand) return false;
    const def = INGREDIENTS[state.hand.kind];
    return def.cook !== null && state.hand.state === 'raw';
  }

  // One player move. Returns true when the move did something.
  function applyAction(action) {
    if (state.over || !action) return false;
    switch (action.type) {
      case 'bin': {
        if (state.hand) return false;
        const def = INGREDIENTS[action.kind];
        // An ingredient that needs no cooking is plate-ready the moment it is
        // picked up; a cookable one stays raw until its station finishes it.
        state.hand = { kind: action.kind, state: def.cook ? 'raw' : 'ready' };
        emit(EVENT_PICKUP, action.kind);
        return true;
      }
      case 'station': {
        const slots = stationSlots(action.station);
        const slot = slots[action.slot];
        if (!slot) return false;
        if (slot.item) {
          // Take a finished (or burnt) item off the station.
          if (slot.item.state === 'cooking') return false;
          if (state.hand) return false;
          state.hand = slot.item;
          slot.item = null;
          emit(EVENT_PICKUP, state.hand.kind);
          return true;
        }
        // Place the raw item in hand onto a free slot of the matching station.
        if (!cookableInHand()) return false;
        if (INGREDIENTS[state.hand.kind].cook !== action.station) return false;
        slot.item = { ...state.hand, state: 'cooking', progress: 0, dinged: false };
        state.hand = null;
        return true;
      }
      case 'plate': {
        const plate = state.plates[action.plate];
        if (!plate) return false;
        // Empty hand on a filled plate scraps the dish (it went wrong).
        if (!state.hand) {
          if (plate.items.length === 0) return false;
          state.wasted += plate.items.length;
          plate.items = [];
          emit(EVENT_TRASH, 'plate');
          return true;
        }
        if (state.hand.state !== 'ready') return false;
        if (plate.items.length >= PLATE_CAPACITY) return false;
        plate.items.push(state.hand.kind);
        state.hand = null;
        emit(EVENT_PICKUP, 'plate');
        return true;
      }
      case 'serve': {
        const plate = state.plates[action.plate];
        if (!plate || plate.items.length === 0) return false;
        const orderIndex = state.orders.findIndex((order) =>
          plateMatchesRecipe(plate.items, recipeById(order.recipeId)),
        );
        if (orderIndex === -1) {
          emit(EVENT_WRONG, plate.items.join('+'));
          return false;
        }
        const order = state.orders[orderIndex];
        const tip = order.patience > 35 ? 3 : order.patience > 18 ? 2 : 1;
        state.coins += order.price + tip;
        state.served += 1;
        state.servedNames.push(order.name);
        state.orders.splice(orderIndex, 1);
        plate.items = [];
        emit(EVENT_SERVE, { name: order.name, coins: order.price + tip, tip });
        return true;
      }
      case 'scrap': {
        const plate = state.plates[action.plate];
        if (!plate || plate.items.length === 0) return false;
        if (state.hand) return false;
        state.wasted += plate.items.length;
        plate.items = [];
        emit(EVENT_TRASH, 'plate');
        return true;
      }
      case 'trash': {
        if (!state.hand) return false;
        state.wasted += 1;
        state.hand = null;
        emit(EVENT_TRASH);
        return true;
      }
      default:
        return false;
    }
  }

  function finishShift(reason) {
    if (state.over) return;
    state.over = true;
    state.overReason = reason;
    state.stars = state.coins >= 150 ? 3 : state.coins >= 100 ? 2 : state.coins >= 50 ? 1 : 0;
    emit(EVENT_OVER, reason);
  }

  function step(dt, actions) {
    if (state.over) return 0;
    let events = 0;
    for (const action of actions ?? []) {
      if (applyAction(action)) events += 1;
    }
    state.time += dt;
    state.shiftLeft = Math.max(0, state.shiftLeft - dt);

    // Orders: patience drains, expired tickets cost a heart.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.hearts -= 1;
        state.wasted += 1;
        emit(EVENT_EXPIRE, order.name);
        if (state.hearts <= 0) finishShift('closed');
      }
    }

    // New tickets arrive on a steady beat while the shift runs.
    state.spawnIn -= dt;
    if (state.spawnIn <= 0 && state.orders.length < MAX_ORDERS) {
      spawnOrder();
      state.spawnIn = ORDER_SPAWN_SECONDS;
    }

    // Stations cook; a finished item dings once, then burns if ignored.
    for (const slots of [state.grill, state.fryer]) {
      for (const slot of slots) {
        const item = slot.item;
        if (!item || item.state !== 'cooking') continue;
        item.progress += dt;
        const def = INGREDIENTS[item.kind];
        if (item.progress >= def.cookSeconds && !item.dinged) {
          item.state = 'ready';
          item.dinged = true;
          emit(EVENT_COOK_DONE, COOKED_NAME[item.kind]);
        } else if (item.progress >= def.cookSeconds + BURN_SECONDS && item.state === 'ready') {
          item.state = 'burnt';
          emit(EVENT_BURNT, item.kind);
        }
      }
    }

    if (state.shiftLeft <= 0) finishShift('shift');
    return events;
  }

  function reset() {
    const fresh = createWorld(random).state;
    for (const key of Object.keys(state)) state[key] = fresh[key];
  }

  return { state, step, applyAction, spawnOrder, reset };
}
