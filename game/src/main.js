// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and game over.
//
// ?seed=N fixes the ticket order. ?shot=start|play|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { createSound } from './sound.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const tParam = Number.parseInt(params.get('t') ?? '', 10);
const shotSeconds = Number.isInteger(tParam) && tParam > 0 ? tParam : undefined;

const canvas = document.getElementById('game');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sound = createSound();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function playEventSound(event) {
  const sounds = {
    pickup: 'pickup',
    'cook-done': 'cook-done',
    serve: 'serve',
    wrong: 'wrong',
    expire: 'expire',
    burnt: 'burnt',
    trash: 'pickup',
  };
  if (sounds[event.kind]) sound.play(sounds[event.kind]);
}

function runShot(name) {
  const scene = stageShot(name, world, shotSeconds);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, null, scene.best, sound.muted, []);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, onAction, onKey);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  const queue = [];

  function onAction(action) {
    sound.unlock();
    if (screen === SCREEN_PLAY) queue.push(action);
  }

  function onKey(kind) {
    sound.unlock();
    if (kind === ACTION_MUTE) {
      sound.toggleMute();
      return;
    }
    if (kind === ACTION_PAUSE && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      return;
    }
    if (kind === ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_PAUSED)) {
      world.reset();
      screen = SCREEN_PLAY;
      return;
    }
    if (kind === ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) {
        world.reset();
        screen = SCREEN_PLAY;
      } else if (screen === SCREEN_OVER) {
        world.reset();
        screen = SCREEN_PLAY;
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
      }
    }
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      const frameEvents = [];
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const actions = queue.splice(0, queue.length);
        world.step(STEP, actions);
        frameEvents.push(...world.state.events);
        world.state.events = [];
        if (world.state.over) {
          screen = SCREEN_OVER;
          if (world.state.coins > best) {
            best = world.state.coins;
            saveBest(best);
          }
          break;
        }
      }
      for (const event of frameEvents) playEventSound(event);
      renderer.draw(world.state, screen, input.mouse.inside ? input.mouse : null, best, sound.muted, frameEvents);
    } else {
      renderer.draw(world.state, screen, input.mouse.inside ? input.mouse : null, best, sound.muted, []);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
