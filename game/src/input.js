// Mouse and keyboard: every click resolves through the renderer's hit regions
// to one world action, and the number keys 1-8 grab ingredients straight from
// the counter. Nothing here touches the world except through applyAction.
import { BINS } from './data.js';
import { KEYS } from './config.js';
import { hitAt } from './render.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';

export function createInput(canvas, onAction, onKey) {
  const mouse = { x: -1, y: -1, inside: false };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function clickToAction(hit) {
    if (!hit) return null;
    switch (hit.zone) {
      case 'bin':
        return { type: 'bin', kind: hit.kind };
      case 'grill':
        return { type: 'station', station: 'grill', slot: hit.slot };
      case 'fryer':
        return { type: 'station', station: 'fryer', slot: hit.slot };
      case 'plate':
        return { type: 'plate', plate: hit.plate };
      case 'serve':
        return { type: 'serve', plate: hit.plate };
      case 'trash':
        return { type: 'trash' };
      default:
        return null;
    }
  }

  canvas.addEventListener('mousemove', (event) => {
    const pos = canvasPos(event);
    mouse.x = pos.x;
    mouse.y = pos.y;
    mouse.inside = true;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.inside = false;
  });
  canvas.addEventListener('click', (event) => {
    const pos = canvasPos(event);
    mouse.x = pos.x;
    mouse.y = pos.y;
    const action = clickToAction(hitAt(pos.x, pos.y));
    if (action) onAction(action);
    else onKey(ACTION_CONFIRM);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '8') {
      onAction({ type: 'bin', kind: BINS[Number.parseInt(key, 10) - 1] });
      return;
    }
    if (KEYS.confirm.includes(key)) onKey(ACTION_CONFIRM);
    else if (KEYS.pause.includes(key)) onKey(ACTION_PAUSE);
    else if (KEYS.mute.includes(key)) onKey(ACTION_MUTE);
    else if (KEYS.restart.includes(key)) onKey(ACTION_RESTART);
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(key)) event.preventDefault();
  });

  return { mouse };
}
