# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Kkajasd/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Kkajasd/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve — Rush Hour Kitchen**: a complete, original cooking game. Tickets fly onto the order board, you pick ingredients from the counter, grill patties and sausages, fry potatoes, build each dish on a plate and serve the matching ticket before its patience runs out. One 150-second shift, three strikes and the kitchen closes, up to three stars.

## Run it

```sh
node --version  # 22.18 or later
python3 -m http.server 8080 --directory game
# open http://localhost:8080
```

Or serve `game/` with any static server — the game is plain static files (`game/index.html` + ES modules), no network request, no build step. Play with mouse and keyboard: click ingredient bins (or keys 1–8) to pick up, click the grill/fryer to cook, click a plate to build the dish, click SERVE when the plate matches a ticket. P pauses, M mutes, R restarts.

## How it is built

- `game/src/config.js` — tuning, layout, palette
- `game/src/data.js` — ingredients and the five-dish menu
- `game/src/world.js` — pure game logic: orders, stations, plates, scoring
- `game/src/render.js` — all art, drawn shapes on canvas (no images)
- `game/src/input.js` — mouse + keyboard
- `game/src/sound.js` — synthesized WebAudio effects, no audio files
- `game/src/shots.js` — the autopilot that stages the screenshots by playing the real rules forward
- `game/src/main.js` — boot and the fixed-step loop
- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — real renders of the game's own code (see `shots.json` for how each was staged)

---

<sub>Entered on [make.fun](https://make.fun/?ref=kaka-aja&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
