# Lovable Integration Guide

## Two-App Architecture → Single Vite Project

The Tidepool Brain has two parts:
1. **VS Code sim engine** (this repo) — vanilla JS: neural brain, world sim, Three.js viz
2. **Lovable React UI** (separate repo) — React dashboard, controls, charts

They must run as **one Vite project** (Option A from the plan).

## How to Merge

### Step 1: Copy sim files into the Lovable project

```
# From Lovable project root:
cp -r <this-repo>/src/sim/       src/sim/
cp -r <this-repo>/src/viz/       src/viz/
cp -r <this-repo>/src/utils/     src/utils/
cp    <this-repo>/src/simAPI.js  src/simAPI.js
cp    <this-repo>/src/simWorker.js src/simWorker.js
```

### Step 2: Install Three.js deps in the Lovable project

```bash
npm install three@^0.160.0 three-stdlib@^2.29.0
```

### Step 3: Replace mock imports in Lovable components

In every Lovable component that imports the mock:
```diff
- import { simAPI } from '@/lib/mockSimAPI'
+ import { simAPI } from '@/simAPI'
```

Or keep `src/lib/mockSimAPI.js` (included) which re-exports the real `simAPI`.

### Step 4: Initialize the sim in your React app's entry point

In `main.tsx` or `App.tsx`, initialize the sim once:

```tsx
import { useEffect } from 'react';
import { simAPI } from '@/simAPI';
import { World } from '@/sim/world';
import { Network, buildDefaultBrain } from '@/sim/brain/network';
import { TrialManager } from '@/sim/trial';
import { Scorer } from '@/sim/scorer';

function App() {
  useEffect(() => {
    if (!simAPI.initialized) {
      const world = new World();
      const network = new Network();
      const trialManager = new TrialManager(30);
      const scorer = new Scorer();
      buildDefaultBrain(network);
      simAPI._init({ world, network, trialManager, scorer });
    }
  }, []);
  // ...
}
```

### Step 5: Mount canvases from React refs

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  if (canvasRef.current) {
    simAPI.mountWorldCanvas(canvasRef.current);
  }
}, []);

return <canvas ref={canvasRef} id="world-canvas" />;
```

### Step 6: Start sim from a React control

```tsx
<button onClick={() => simAPI.start()}>Start</button>
<button onClick={() => simAPI.pause()}>Pause</button>
```

## API Surface for Lovable Components

| Method | Returns | Used by |
|--------|---------|---------|
| `simAPI.getStats()` | Full dashboard data object | Stats panels, charts |
| `simAPI.getSnapshot()` | Brain neuron/connection data | Brain 3D view |
| `simAPI.start()` / `pause()` | void | Play/pause controls |
| `simAPI.reset()` | void | Reset button |
| `simAPI.setTimeScale(n)` | void | Speed slider |
| `simAPI.setScenario(name)` | void | Scenario dropdown |
| `simAPI.toggleModule(name)` | void | Brain module toggle chips |
| `simAPI.toggleAblation(name)` | void | Ablation experiment toggles |
| `simAPI.exportData()` | Triggers JSON download | Export button |
| `simAPI.mountWorldCanvas(el)` | Promise | World viz canvas ref |
| `simAPI.mountBrainCanvas(el)` | Promise | Brain viz canvas ref |

## `getStats()` Fields

```ts
{
  step: number,
  trial: number,
  totalTrials: number,
  creature: { x, y, theta, vx, vy, energy, hunger, lastReward, rewardTimer },
  daylight: number,          // 0-1
  isNight: boolean,
  stepsToNightfall: number,
  nutritionPhase: string[],  // e.g. ['A','B']
  nutritionTypes: string[],
  scorer: { survivalFraction, foragingAccuracy, adaptationScore, ... },
  scorerHistory: { energy: number[], correctEatPct: number[], activity: number[] },
  brainActivity: { chemo: number, predator: number, shelter: number, value: number, motor: number },
  neuronCount: number,
  connectionCount: number,
  M1: number,
  M2: number,
  timeScale: number,
  running: boolean,
  ablations: { learningDisabled: boolean, ablatedModules: string[] },
  chemicalHistory: number[],    // last 100 chemical sensor readings
  acousticLHistory: number[],   // last 100 left ear readings
  acousticRHistory: number[],   // last 100 right ear readings
  predatorHitSteps: number[]    // last 20 step numbers where hits occurred
}
```

## `getSnapshot()` Fields

```ts
{
  neurons: Array<{ id, module, type, output, position3D }>,
  connections: Array<{ fromId, toId, weight, idx }>,  // top 500 by |weight|
  activityThisStep: number,
  neuronCount: number,
  moduleNeuronCounts: { chemo, predator, shelter, value, motor },  // for badge counts
  M1: number,
  M2: number
}
```

## Vite Config

Add to your Lovable `vite.config.ts`:
```ts
optimizeDeps: {
  include: ['three', 'three-stdlib']
}
```
