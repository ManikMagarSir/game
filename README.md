# VOXEL SURVIVOR R3F

Browser first-person voxel zombie-survival FPS — a full rewrite of the vanilla
`voxel-survivor` prototype on **React · TypeScript · Three.js · React Three Fiber ·
Vite · Zustand · Framer Motion · Tailwind CSS**.

Legacy reference (frozen, do not edit): `C:\Users\manik\Desktop\voxel-survivor copy`
(`docs/DOCUMENTATION.md` = canonical spec, `docs/plan.md` = migration plan,
`docs/tracking.md` = progress log).

## Run

Plug-and-play (checks Node 20+, installs deps on first run, then starts):

```bash
./start.sh            # dev server at http://127.0.0.1:5173 (macOS/Linux/Git Bash/WSL)
start.bat             # same, native Windows (double-click works too)

./start.sh test       # unit tests
./start.sh e2e        # Playwright e2e (installs Chromium once)
./start.sh build      # production build + PWA precache
./start.sh preview    # serve the production build
```

Or manually:

```bash
npm i
npm run dev     # http://127.0.0.1:5173
npm test        # vitest (19 tests)
npx playwright test   # e2e: lobby → intro → HUD → shop → render loop
npm run build   # tsc + vite + PWA precache
```

## CORS

Single point of control: `.env` (personal overrides in `.env.local`,
git-ignored). `vite.config.ts` reads it and applies the headers to the dev
server + preview, plus an optional `/api` dev proxy. The app itself makes
zero cross-origin requests (Three.js is bundled, no CDN, no backend yet),
so by default this only hardens local serving.

| Var | Default |
|---|---|
| `CORS_ALLOW_ORIGIN` | `http://127.0.0.1:5173` |
| `CORS_ALLOW_METHODS` | `GET,POST,PUT,PATCH,DELETE,OPTIONS` |
| `CORS_ALLOW_HEADERS` | `Content-Type,Authorization` |
| `API_PROXY_TARGET` | _(empty = disabled)_ |

## Controls

| Input | Action |
|---|---|
| WASD / left stick / gamepad LS | Move |
| Mouse / right drag / gamepad RS | Look |
| Click / RT / FIRE | Shoot (auto guns hold) |
| RMB / AIM | Aim (zoom; sniper 25°, scope 38°) |
| 1-8 / wheel / RB-LB / WPN | Swap weapon |
| F / X / MELEE | Melee (shield-piercing) |
| G / Y / NADE | Grenade |
| B | Field shop (weapons, repair, turret) |
| Esc | Pause · intro: skip |

## Architecture

* `src/game/` — pure data + balance (`config`, `balance`, `constants`, `types`).
  No THREE/DOM; covered by vitest.
* `src/store/` — Zustand: `useGameStore` (run state), `useZombieStore`,
  `useWorldStore`, `useEntStore` (projectiles/grenades/pickups/turrets),
  `useFxStore` (transient FX), `useSettingsStore` (persisted),
  `useProfileStore` (named profiles + legacy migration), `playerRef`
  (60 Hz mutable hot state — never in React state).
* `src/canvas/` — R3F: `GameCanvas`, `GameLoop` (fixed-clamp tick: waves,
  hitscan, melee, grenades, modes), `PlayerController`, `World` (instanced),
  `Zombies` (AI incl. boss brain), `WeaponViewModel`, `Effects`.
* `src/systems/` — `rays` (hitscan math), `audio` + `music` (procedural WebAudio),
  `storage` (zod-sanitized profiles), `progression`, `waves`.
* `src/components/` — HUD, Minimap, Shop, CareerShop, ProfileBar, IntroCanvas,
  TouchControls.

## Parity notes vs legacy

* Same 8 weapons / 9 zombies / 5 modes / 5 boss forms / XP+shop+career numbers.
* Fixed along the way: 3600-mesh ground → 2 instanced draws; per-shot geometry
  churn → pooled FX; O(n²) separation kept for n<40 with screamer cap;
  `sanitize()` ownedWeapons wipe (zod schema); manual SW version → VitePWA.
* Boss placeholder `brute` replaced by real 5-form boss in an earlier slice.
