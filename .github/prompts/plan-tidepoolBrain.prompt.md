# Plan: Tidepool Brain — Full Implementation

## TL;DR
Build a complete simulation engine, neural brain (500 neurons, 10k connections), and Two Three.js 3D visualizations for the "Tidepool Brain" hackathon project from scratch. The workspace is empty. The spec provides exact code for nearly every module. Implementation follows a bottom-up dependency order across 5 phases, with utilities and physics first, brain second, visualization third, integration last.

---

## Phase 1: Scaffolding & Utilities (no dependencies)

**All steps in this phase can run in parallel.**

1. **Create project scaffolding** — `package.json`, `vite.config.js`, `index.html`, and the full directory tree (`src/sim/brain/modules/`, `src/viz/`, `src/utils/`)

2. **Implement `src/utils/math.js`** — `clamp`, `lerp`, `torusWrap`, `torusDist`, `torusVec2`, `vec2Len`, `vec2Norm`, `gaussNoise`. All pure functions, exact code provided in spec.

3. **Implement `src/utils/ringBuffer.js`** — `RingBuffer` class with `push(val)`, `get(stepsAgo)`, `toArray()`. Uses `Float32Array`. Exact code provided.

4. **Implement `src/utils/eventBus.js`** — Simple pub/sub: `on`, `off`, `emit`. Exact code provided. Events: `nutritionRotation`, `predatorHit`, `shelterEnter`, `shelterExit`, `toxicEat`, `nutritiousEat`, `trialEnd`, `allTrialsComplete`.

5. **Run `npm install`** to get `three`, `three-stdlib`, `vite`.

**Verification:** Each utility module exports correctly; `RingBuffer` returns correct delayed values; `torusWrap`/`torusDist` handle wraparound; `gaussNoise` produces values centered on 0.

---

## Phase 2: Simulation Core (depends on Phase 1)

Steps 6-9 are sequential (each depends on previous). Step 10 is parallel with 8-9.

6. **Implement `src/sim/world.js`** — WORLD constants object, `World` class with: *(Fixes 1, 2, 3, 7)*
   - Creature state: `{x, y, vx, vy, theta, energy, hunger, rewardTimer, lastReward}`
   - **`tick(thrust, turn_rate, eat)`** (not `step` — Fix 1): exact physics from spec (theta update, F_net, drag, velocity, torusWrap)
   - Property **`currentStep`** (not `step` — Fix 1) for timestep counter
   - `daylight(t)` function: **`0.5 + 0.5 * sin(2πt/800)`** (no square — Fix 7, corrected so night actually occurs)
   - `current(x, y, t)`: two vortices + tidal current, toroidal shortest-path
   - Nutrition rotation every 600 steps, cycling through `NUTRITION_SEQUENCE`
   - Energy floor at 0 (no death), `stepsAlive` tracking
   - **Hunger**: passive `+0.0005/step`, `-0.3` on eat, clamped [0,1] (Fix 3)
   - Full class body: `reset(config)`, `getState()`, `getScorerState()`, `getSensorVector()`, `setScenario()`, `_inAnyShelter()`, `_logEvent()` (Fix 2)
   - `eventLog` array (max 200 entries) for UI consumption
   - `scenarioMods` object for heatwave/polluted multipliers
   - Shelter logic: inside shelter radius → protected from night drain; outside at night → `OUTSIDE_NIGHT_ENERGY` per step

7. **Implement `src/sim/food.js`** — `FoodManager` class: *(Fix 10)*
   - Maintain 30 food sources across types A/B/C/D
   - Each source has position, type, `emissionBuffer` (RingBuffer size 50), period from `FOOD_PULSE_PERIODS`, `respawnTimer`
   - **`tick(t)`**: push emission value = `exp(-phase²/(2σ²))` where `phase = t % period`, countdown respawn timers
   - **`computeChemicalSignal(pos, t)`**: sum delayed/attenuated signals from sources within 40 units, `delay = round(d / V_CHEM)`, `signal = emissionDelayed / max(d, 0.5)`, plus `gaussNoise(SENSOR_NOISE_SIGMA)`
   - **`tryEat(cx, cy, eatDist)`**: find nearest alive source within dist, mark consumed with `respawnTimer`, return source or null
   - **`nearestNutritiousPos(cx, cy, nutritionPhase)`**: closest alive nutritious source for scorer nav efficiency
   - **`reset(foodPositions)`**: rebuild from trial config
   - **`getSnapshot()`**: positions + alive status for viz

8. **Implement `src/sim/predator.js`** — `PredatorManager` class: *(Fix 11)*
   - 3 predators on Lissajous paths: `x(t) = cx + Ax*sin(wx*t + phx)`, same for y
   - **`tick(t)`**: update positions, push acoustic emission `sin(2π*47*t/1000)` into `acousticBuffer` (RingBuffer size 30)
   - **`computeAcousticSignals(creature, t)`**: for each ear (offset ±0.3 perpendicular to heading), sum delayed/attenuated signals from all predators, plus noise
   - **`checkHit(cx, cy, radius)`**: return `{ agent, teleport() }` or null; teleport relocates `cx`/`cy` randomly
   - **`reset(params)`**: create agents from Lissajous params with fresh acoustic buffers
   - **`getSnapshot()`**: positions + IDs for viz

9. **Implement `src/sim/sensors.js`** — `buildSensorVector()` returning `Float32Array(30)`:
   - [0] chemical signal
   - [1-2] acoustic L/R
   - [3-18] 8 proximity rays × 2 (dist + objType), range scaled by daylight
   - [19-22] shelter beacon unit vectors (2 shelters × 2 components)
   - [23-26] proprioception (speed, theta, vx, vy)
   - [27-29] internal state (energy/MAX, hunger, reward signal)
   - Noise on continuous channels only

10. **Implement `src/sim/trial.js`** — `TrialManager` class (*parallel with 8-9*):
    - `mulberry32` seeded PRNG
    - `generateTrialConfig(trialIndex)`: deterministic food positions, predator Lissajous params, shelter positions, creature start, nutrition start phase
    - `startNextTrial()`, `recordTrialResult()`, `isComplete()`, `getAggregateScores()`

11. **Implement `src/sim/scorer.js`** — `Scorer` class (*depends on 6*):
    - Track: stepsAlive, correctEats, toxicEats, predatorHits, nightInShelterSteps, pathLength, activityCost
    - `update()` called each step, `recordEat()`, `onNutritionRotation()`, `recordPredatorHit()`
    - `getTrialMetrics()`: compute all 7 scoring metrics (survival, foraging accuracy, adaptation, predator avoidance, shelter timing, navigation efficiency, activity efficiency)
    - Ring buffers for history charts (energy, correctEat%, activity)

**Verification:** Run world for 100 steps with fixed inputs, verify creature moves, energy drains at night, food chemical signals have correct delay, predator acoustic signals produce L/R difference, all 30 sensor slots populated.

---

## Phase 3: Neural Brain (depends on Phase 1; parallel with Phase 2 food/predator/sensors)

12. **Implement `src/sim/brain/neuron.js`** — Base `Neuron` class + `NeuronR` (leaky integrator) + `NeuronO` (oscillatory band-pass):
    - `NeuronR.step(inputs)`: `u = leak*u + sum(inputs) + bias`, `output = tanh(u)`, NaN guard
    - `NeuronO.step(inputs)`: 2D rotation `[u,v]` with `decay`, `omega`, `coupling`, `output = tanh(u)`, NaN guard

13. **Implement `src/sim/brain/learningRule.js`** — `applyLearningRule(connection, pre, post, M1, M2)`:
    - `Δw = η * pre * post * (α*M1 + β*M2)`, NaN guard, clamp to `±MAX_WEIGHT`, homeostatic decay

14. **Implement `src/sim/brain/network.js`** — `Network` class + `HP` constants + `SENSOR_MAP`:
    - `addNeuron()` with 500-neuron cap, `addConnection()` with 10k cap + delay buffer
    - `step(sensorVector)`: inject sensors → deliver delayed signals → step neurons → compute activity → update M1/M2 → apply learning → return 3 actions
    - `resetStates()` (between trials, preserve weights), `resetFull()` (full restart)
    - `getSnapshot()` (top 500 connections by weight for render)
    - `getActivityStats()`, `getWeightHistories()`, `getWiringDiagram()`

15. **Implement `buildDefaultBrain(network)`** in `network.js` — Wire all 5 modules (*depends on 12-14*): *(Fixes 4, 5)*
    - Module 1: Chemo Decoder — 4 banks × 8 NeuronO + 4 NeuronR evidence neurons with lateral inhibition (~36 neurons)
    - Module 2: Value Memory — 4 NeuronR value neurons fed by food evidence + reward + hunger (~4 neurons)
    - Module 3: Predator Localisation — 2 banks × 8 NeuronO (L/R ears) + 8 NeuronR comparison + 3 danger output neurons (~27 neurons)
    - Module 4: Shelter Timing — 8-neuron recurrent ring + 4 policy neurons (~12 neurons) — **entrain from energy + reward + ray(0), NOT daylight** (Fix 4)
    - Module 5: Motor Control — 25 steering + 25 thrust + 2 eat gate + 3 output NeuronR (~55 neurons)
    - **Ablation support**: `network.step()` checks `_learningDisabled` and `_ablatedModules` (Fix 5)
    - Total: ~30 input + ~134 processing ≈ 164 neurons, well under 500 cap
    - Verify connection count stays under 10,000

16. **Implement module stub files** in `src/sim/brain/modules/` (*parallel with 15*):
    - `chemoDecoder.js`, `valueMemory.js`, `predatorLocator.js`, `shelterTimer.js`, `motorControl.js`
    - These are documentation/organization files; the actual wiring is in `buildDefaultBrain()`. They could export helper constants or be purely documentary. Decision: keep as thin reference files exporting module metadata (neuron ID ranges, descriptions) for `docExporter` and `brainView` layout.

**Verification:** Create network, verify neuron count ≤ 500, connection count ≤ 10,000. Feed random sensor vectors for 100 steps, verify outputs are in correct ranges, no NaN. Verify weights change under non-zero reward. Verify `resetStates()` preserves weights but zeros membrane potentials.

---

## Phase 4: Visualization (depends on Phase 3 for brain data structures; Phase 2 for world state)

17. **Implement `src/viz/worldView.js`** — `WorldView` class:
    - Three.js scene: top-down orthographic camera over 100×100 torus
    - Ground plane with grid, day/night ambient lighting transition
    - Creature: small mesh (cone/arrow) oriented to `theta`, trail line (skip segments > 50 units to avoid torus warp lines)
    - Food: colored spheres (A=red, B=green, C=blue, D=yellow), pulsing opacity matching emission
    - Predators: red octahedra on Lissajous paths
    - Shelters: translucent domes with amber point lights at night
    - Current flow: subtle animated arrows or particle system
    - Day/night: ambient light intensity follows `daylight(t)`, sky color shifts
    - Nutrition phase indicator overlay (optional, could be HUD in React)
    - `init()`, `update(worldState)`, `render()`, `dispose()`

18. **Implement `src/viz/brainView.js`** — `BrainView` class:
    - Three.js scene: perspective camera, orbit controls
    - Neurons as spheres, color-coded by module (chemo=green, value=gold, predator=red, shelter=blue, motor=purple, input=white)
    - Sphere size/glow proportional to `|output|`
    - Layout: modules in spatial clusters (3D positions assigned in `buildDefaultBrain` or here)
    - Connections: lines between neurons, opacity/width proportional to `|weight|`, color = sign (positive=blue, negative=red)
    - Only render top 500 connections by weight (from `getSnapshot()`)
    - Selective bloom on neuron layer (layer-based: neurons on layer 1, bloom pass on layer 1 only, additive composite)
    - Raycaster for hover/click → dispatch `CustomEvent` on canvas element (`neuronHover`, `neuronClick`, `neuronLeave`)
    - `setModuleHighlight(activeModules)`: dim inactive modules
    - `init(network)`, `update(snapshot)`, `render()`, `dispose()`

**Verification:** Mount each view to a test canvas, verify renders without errors, verify brain view raycaster fires events, verify worldView handles torus wrapping visually.

---

## Phase 5: Integration & API (depends on all above)

19. **Implement `src/simAPI.js`** — Public API surface:
    - `mountWorldCanvas(canvas)`, `mountBrainCanvas(canvas)` — lazy-load viz modules
    - `start()`, `pause()`, `reset()`
    - `setTimeScale(m)` — clamp 0.1–10
    - `setScenario(name)` — 'baseline' | 'heatwave' | 'polluted'
    - `toggleModule(name)` — visual highlight only
    - `toggleAblation(name)` — 'learning' | 'predatorModule' | 'shelterTiming'
    - `exportData()` — trigger JSON download via `docExporter`
    - `getStats()` — all dashboard data
    - `getSnapshot()` — brain snapshot for viz
    - Note: `mountWorldCanvas`/`mountBrainCanvas` use dynamic `import()` (async) — need `async` keyword on those methods

20. **Implement `src/main.js`** — Master loop:
    - Instantiate World, Network, TrialManager, Scorer
    - Call `buildDefaultBrain(network)`
    - Start first trial via `trialManager.startNextTrial()`
    - `requestAnimationFrame` loop: step sim (capped at 50 steps/frame), render viz
    - Trial end listener: record metrics, start next trial or emit `allTrialsComplete`
    - Time scale > 3: offload to Web Worker (stretch goal — can defer)

21. **Implement `src/utils/docExporter.js`** — `exportSubmissionData()`:
    - Collects neuron types, learning rule description, wiring diagram, trial results, aggregate scores, ablation results, weight histories
    - Exports as downloadable JSON blob

22. **Create `index.html`** — Minimal HTML with two canvas elements (or mount points) + `<script type="module" src="/src/main.js">`

**Verification:**
1. `npm run dev` starts without errors
2. World renders creature moving, food pulsing, predators on paths, day/night cycling
3. Brain renders neurons with activity, connections with weight colors
4. `simAPI.getStats()` returns all expected fields
5. Run 1 full trial (20,000 steps) — verify `trialEnd` fires with valid metrics
6. Run all 30 trials — verify `allTrialsComplete` fires with aggregate scores
7. `simAPI.exportData()` produces valid JSON with all required submission fields
8. Ablation toggle disables learning (weights stop changing)
9. No NaN in any output after 30 trials
10. Neuron count ≤ 500, connection count ≤ 10,000 throughout

---

## Relevant Files (all new — to be created)

- `package.json` — project deps (three, three-stdlib, vite)
- `vite.config.js` — esnext target, optimizeDeps
- `index.html` — entry point with canvases
- `src/main.js` — master loop, instantiation, RAF
- `src/simAPI.js` — public API for React UI
- `src/utils/math.js` — pure math helpers
- `src/utils/ringBuffer.js` — circular buffer for delayed signals
- `src/utils/eventBus.js` — pub/sub event system
- `src/utils/docExporter.js` — submission JSON export
- `src/sim/world.js` — WORLD constants, World class, physics, day/night, current, shelter, nutrition rotation
- `src/sim/food.js` — FoodManager, chemical emission, eat logic
- `src/sim/predator.js` — PredatorManager, acoustic emission, Lissajous paths, hit detection
- `src/sim/sensors.js` — 30-float sensor vector builder
- `src/sim/trial.js` — TrialManager, seeded PRNG, deterministic configs
- `src/sim/scorer.js` — Scorer with 7 metrics
- `src/sim/brain/neuron.js` — Neuron base, NeuronR, NeuronO
- `src/sim/brain/network.js` — Network class, HP constants, SENSOR_MAP, buildDefaultBrain()
- `src/sim/brain/learningRule.js` — Hebbian + modulated learning rule
- `src/sim/brain/modules/*.js` — 5 module metadata stubs
- `src/sim/simWorker.js` — Web Worker stub (Fix 9)
- `src/viz/worldView.js` — Three.js top-down world renderer
- `src/viz/brainView.js` — Three.js 3D brain renderer with bloom

---

## Decisions

- **No Web Worker in v1**: The spec mentions a worker for timeScale > 3, but this is a stretch goal. Implement main-thread only first; add worker if time permits. A `simWorker.js` stub is still created so Vite doesn't error on the `new Worker(...)` import.
- **Module stub files**: Keep as thin metadata exports (neuron ID ranges, descriptions) rather than duplicating wiring logic. All wiring lives in `buildDefaultBrain()`.
- **`mountWorldCanvas`/`mountBrainCanvas` must be `async`**: The spec code uses `await import(...)` but the methods aren't marked `async`. Fix this — and assign results to `window._worldView` / `window._brainView` so the main loop can reference them (see Fix 6).
- **Hunger state**: Implement as a **passive increasing value** — `hunger += 0.0005` per step (reaches 1.0 after ~2000 steps without eating), partially reset on any eat (`hunger -= 0.3`, clamped to 0). This is NOT derived from energy — it's independent state on `creature` (see Fix 3).
- **Ray casting for proximity sensors**: The spec doesn't detail the ray-object intersection algorithm. Implement as: iterate all world objects, for each ray check if any object falls within the ray cone (angle tolerance ~5°) and within `effectiveRange`. Return nearest hit distance and type.
- **`world.step` → `world.tick()` + `world.currentStep`**: The spec uses `world.step` as both a method and a property — a fatal JS conflict. Rename the method to `world.tick()` and the counter property to `world.currentStep` everywhere (see Fix 1).
- **Scenario variants** (heatwave/polluted): implement as multipliers on existing constants via `world.scenarioMods`, not separate world configs.
- **Daylight formula correction**: The spec writes `0.5 + 0.5 * sin²(2πt/800)` which ranges [0.5, 1.0] — night never occurs. Use the corrected formula `0.5 + 0.5 * sin(2πt/800)` (no square) everywhere, giving range [0, 1] with night when < 0.3 (see Fix 7).
- **No direct daylight sensor**: The 30-float sensor vector has no daylight slot. The shelter timing module must entrain from indirect cues only — energy changes, proximity ray range shrinkage, and reward patterns (see Fix 4).

## Further Considerations

1. **Performance at 10× time scale**: At timeScale=10 with ~164 neurons and ~1000+ connections, each step involves ~1000+ multiply-adds. At 50 steps/frame × 60fps = 3000 steps/sec — should be fine on modern hardware without a worker. Monitor and add worker only if needed.

2. **Three.js selective bloom**: Requires `EffectComposer`, `RenderPass`, `UnrealBloomPass` from three-stdlib, plus a custom shader for layer-selective bloom. This is the most complex viz piece — implement basic glow first, refine bloom pass later.

3. **Torus visualization edge case**: The spec says to skip trail segments > 50 units. Also need to handle food/predator/shelter rendering near edges — consider rendering "ghost" copies near borders for objects within ray range of an edge.

---

## Critical Fixes (12 bugs found in original spec — all must be applied during implementation)

### Fix 1 — `world.step` naming conflict (💥 Crash)

**Problem:** `world.step` used as both a property (timestep counter) and a method (advance simulation) — fatal JS conflict.

**Resolution:** Rename throughout the entire codebase:
- Method: `world.tick(thrust, turn_rate, eat)`
- Property: `world.currentStep`
- All references in `main.js`, `simAPI.js`, `scorer.js` etc. updated accordingly

```js
// world.js:
export class World {
  constructor() { this.currentStep = 0; }
  tick(thrust, turn_rate, eat) { this.currentStep++; /* physics */ }
}
// main.js:
world.tick(thrust, turn_rate, eat);
if (world.currentStep >= WORLD.TRIAL_LENGTH) { ... }
```

---

### Fix 2 — `World` class body never defined (💥 Crash)

**Problem:** `world.js` is heavily referenced but its class body — `getState()`, `getScorerState()`, `reset(config)`, `setScenario()`, `eventLog`, hunger — was never implemented.

**Resolution:** Implement full `World` class with:
- `tick(thrust, turn_rate, eat)` — nutrition rotation, day/night, physics, food tick + eat, predator tick + hit, shelter energy, reward timer, hunger, energy floor, survival tracking
- `daylight(t)` — corrected formula (see Fix 7)
- `current(x, y, t)` — two vortices + tidal, toroidal shortest-path
- `_inAnyShelter(x, y)` — helper for shelter radius check
- `_logEvent(msg)` — capped at 200 entries
- `getSensorVector()` — delegates to `buildSensorVector()`
- `getState()` — full snapshot for viz
- `getScorerState()` — subset for scorer
- `reset(config)` — deterministic reset from trial config
- `setScenario(name)` — multipliers: baseline/heatwave/polluted via `scenarioMods`

---

### Fix 3 — Hunger mechanic never defined (🔴 Wrong sensor[28])

**Problem:** PS specifies `hunger (0→1)` as sensor index 28 but never defines how it changes.

**Resolution:** Implement as independent state on `creature`:
```js
// Per step in world.tick():
c.hunger = Math.min(1, c.hunger + 0.0005); // reaches 1.0 after ~2000 steps without eating
// On any eat (nutritious or toxic):
c.hunger = Math.max(0, c.hunger - 0.3);    // eating reduces hunger by 0.3
```

---

### Fix 4 — Daylight is NOT in the sensor vector (🔴 Design implication)

**Problem:** The 30-float sensor vector has no daylight slot. The brain has NO direct daylight sensor — it must infer cycle from indirect cues.

**Resolution:** The shelter timing ring oscillator (Module 4) must entrain from:
1. Energy sensor (drops at night when outside shelter)
2. Reward sensor (nutritious eating during day)
3. Proximity ray range (shrinks at night via `effectiveRange = RAY_RANGE * daylight(t)`)

```js
// Fix wiring in buildDefaultBrain — Module 4 ring neurons:
for (let k = 0; k < 8; k++) {
  network.addConnection(inputIds[SENSOR_MAP.energy], ringIds[k], 0.15, 0);
  network.addConnection(inputIds[SENSOR_MAP.reward], ringIds[k], 0.08, 0);
  network.addConnection(inputIds[SENSOR_MAP.ray(0)], ringIds[k], 0.05, 0);
}
```

---

### Fix 5 — `_learningDisabled` / `_ablatedModules` never checked (🔴 Ablation no-ops)

**Problem:** Ablation flags are set in `simAPI` but never acted on in `network.step()`.

**Resolution:** Add checks inside `network.step()`:
```js
// Step 3 — neuron update: skip ablated modules
for (const n of this.neurons) {
  if (n.type === 'input') continue;
  if (this._ablatedModules && this._ablatedModules.includes(n.module)) {
    n.output = 0;
    continue;
  }
  n.step([inputAccum[n.id]]);
}

// Step 6 — learning: respect disabled flag
if (!this._learningDisabled) {
  for (let ci = 0; ci < this.connections.length; ci++) { ... }
}
```

---

### Fix 6 — `window._worldView` / `window._brainView` never assigned (💥 Blank canvas)

**Problem:** Main loop checks `window._worldView` / `window._brainView` for render calls, but `simAPI.mountWorldCanvas` / `mountBrainCanvas` never assign to these globals.

**Resolution:** In `simAPI.js`, make mount methods `async` and assign:
```js
async mountWorldCanvas(canvas) {
  const { WorldView } = await import('./viz/worldView.js');
  const wv = new WorldView(canvas);
  wv.init();
  window._worldView = wv;
},
async mountBrainCanvas(canvas) {
  const { BrainView } = await import('./viz/brainView.js');
  const bv = new BrainView(canvas);
  bv.init(network);
  window._brainView = bv;
},
```

---

### Fix 7 — Daylight formula `sin²` bug + `computeStepsToNightfall` undefined (🔴 Night never fires / 🟡 Stats crash)

**Problem 7a:** The spec writes `daylight(t) = 0.5 + 0.5 × sin²(2πt/800)`. Since sin² ∈ [0,1], this gives daylight ∈ [0.5, 1.0] — night (daylight < 0.3) **never occurs**. Almost certainly a PS typo.

**Resolution:** Use corrected formula everywhere (`world.js`, `sensors.js`, `worldView.js`):
```js
daylight(t) { return 0.5 + 0.5 * Math.sin(2 * Math.PI * t / WORLD.DAY_PERIOD); }
// Range [0, 1], night when < 0.3
```

**Problem 7b:** `computeStepsToNightfall(t)` referenced in `simAPI.getStats()` but never defined.

**Resolution:** Add utility function:
```js
function computeStepsToNightfall(t) {
  const period = WORLD.DAY_PERIOD;
  for (let dt = 1; dt <= period; dt++) {
    const dl = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t + dt) / period);
    if (dl < 0.3) return dt;
  }
  return period;
}
```

---

### Fix 8 — Missing imports throughout (💥 Crash)

**Resolution:** Ensure these imports are present:
```js
// network.js:
import { RingBuffer } from '../../utils/ringBuffer.js';
import { clamp } from '../../utils/math.js';

// scorer.js:
import { RingBuffer } from '../utils/ringBuffer.js';
import { torusDist } from '../utils/math.js';
import { WORLD } from './world.js';

// simAPI.js:
import { vec2Len } from './utils/math.js';
import { WORLD } from './sim/world.js';
import { on } from './utils/eventBus.js';

// main.js:
import { WORLD } from './sim/world.js';
```

---

### Fix 9 — `simWorker.js` stub missing (💥 Vite error)

**Problem:** `main.js` references `new Worker(new URL('./sim/simWorker.js', import.meta.url))` but the file doesn't exist. Vite will error during build.

**Resolution:** Create `src/sim/simWorker.js` stub:
```js
import { World } from './world.js';
import { Network, buildDefaultBrain } from './brain/network.js';

const world = new World();
const network = new Network();
buildDefaultBrain(network);

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    world.reset(e.data.config);
    network.resetStates();
  }
  if (e.data.type === 'step') {
    for (let i = 0; i < (e.data.count || 1); i++) {
      const sensors = world.getSensorVector();
      const [thrust, turn_rate, eat] = network.step(sensors);
      world.tick(thrust, turn_rate, eat);
    }
    self.postMessage({ type: 'state', worldState: world.getState(), brainSnapshot: network.getSnapshot() });
  }
};
```

---

### Fix 10 — `FoodManager` methods undefined (💥 Crash)

**Problem:** `world.tick()` calls `foods.tick()`, `foods.tryEat()`, `foods.nearestNutritiousPos()`, `foods.reset()`, `foods.getSnapshot()` — none defined.

**Resolution:** Implement all five methods in `FoodManager`:
- `tick(t)` — push emission values into each source's ring buffer, countdown respawn timers
- `tryEat(cx, cy, eatDist)` — find nearest alive source within `eatDist`, mark consumed with `respawnTimer = FOOD_RESPAWN_STEPS`, return source or null
- `nearestNutritiousPos(cx, cy, nutritionPhase)` — find closest alive source of a nutritious type
- `reset(foodPositions)` — rebuild sources from trial config
- `getSnapshot()` — return positions + alive status for viz
- `computeChemicalSignal(pos)` — sum delayed/attenuated signals within 40 units

---

### Fix 11 — `PredatorManager` methods undefined (💥 Crash)

**Problem:** `world.tick()` calls `predators.tick()`, `predators.checkHit()`, `predators.reset()`, `predators.getSnapshot()` — none defined.

**Resolution:** Implement full `PredatorManager` class:
- `reset(params)` — create 3 agents from Lissajous params, each with `acousticBuffer` (RingBuffer size 30)
- `tick(t)` — update positions via Lissajous, push acoustic emission `sin(2π*47*t/1000)`
- `checkHit(cx, cy, radius)` — check each agent, return `{ agent, teleport() }` or null
- `getSnapshot()` — return positions + IDs for viz
- `computeAcousticSignals(creature, t)` — for each ear (offset ±0.3 perpendicular to heading), sum delayed/attenuated signals + noise

---

### Fix 12 — Ablation result recording missing (🟡 Empty export)

**Problem:** `simAPI.exportData()` references `window._ablationResults` but it's never populated.

**Resolution:** In `simAPI.toggleAblation()`, push a record each time:
```js
window._ablationResults = window._ablationResults || [];
window._ablationResults.push({
  name, enabled: ablations[name],
  step: world.currentStep,
  trial: trialManager.currentTrial,
  statsAtToggle: simAPI.getStats()
});
```

---

### Fix Summary Table

| # | Bug | File(s) | Severity | Status |
|---|-----|---------|----------|--------|
| 1 | `world.step` property/method collision | `world.js`, `main.js`, `simAPI.js` | 💥 Crash | Resolved: `tick()` + `currentStep` |
| 2 | `World` class body undefined | `world.js` | 💥 Crash | Resolved: full class implemented |
| 3 | `hunger` mechanic undefined | `world.js` | 🔴 Wrong sensor | Resolved: passive +0.0005/step, -0.3 on eat |
| 4 | Daylight not in sensor vector | `network.js` (buildDefaultBrain) | 🔴 Design | Resolved: entrain from indirect cues |
| 5 | Ablation flags never checked | `network.js` | 🔴 No-ops | Resolved: checks in `step()` |
| 6 | `window._worldView` never assigned | `simAPI.js` | 💥 Blank canvas | Resolved: assign in mount methods |
| 7 | `sin²` formula + missing utility | `world.js`, `simAPI.js` | 🔴 Night never fires | Resolved: corrected formula + utility |
| 8 | Missing imports in 4 files | multiple | 💥 Crash | Resolved: imports added |
| 9 | `simWorker.js` missing | `main.js` | 💥 Vite error | Resolved: stub created |
| 10 | `FoodManager` methods undefined | `food.js` | 💥 Crash | Resolved: 6 methods implemented |
| 11 | `PredatorManager` methods undefined | `predator.js` | 💥 Crash | Resolved: 5 methods implemented |
| 12 | Ablation results never recorded | `simAPI.js` | 🟡 Empty export | Resolved: push on toggle |
