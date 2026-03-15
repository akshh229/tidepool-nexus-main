# 🏛️ Tidepool Brain - System Architecture

This document outlines the architectural design of **The Tidepool Brain**, detailing how the simulation engine, neural components, React user interface, and 3D visualization layers connect.

---

## 1. High-Level Architecture
The project follows a decoupled architecture separating the headless biological simulation from the visual frontend. It consists of three primary layers:
1. **Simulation Engine (Backend / Vanilla JS):** The headless state machine processing physics, chemical dispersion, and neural updates.
2. **State & Bridge Layer (Zustand + Data Bridge):** A communication pipe capturing telemetry and moving it smoothly into the UI.
3. **Visualization & UI (React + Three.js):** The control dashboard and 3D viewport panels.

---

## 2. The Simulation Engine (`/src/sim/`)
Written entirely in stateless Vanilla JS to ensure max performance without React rendering overhead.
* **`world.js`**: Manages physics, momentum, entity positions, and boundary-wrapping for the toroidal grid.
* **`trial.js` (Trial Manager)**: Handles the 20,000-step time loop per generation/epoch.
* **`scorer.js`**: Evaluates fitness based on survival, foraging accuracy, and energy retention.
* **Entity Scripts (`food.js`, `predator.js`)**: Determine environmental hazards, Lissajous patrol paths, and chemical pulse periods (for food discrimination).

---

## 3. Neural Network Architecture (`/src/sim/brain/`)
A custom-built computational brain with **164 neurons** and **330 connections**. It relies on localized synaptic plasticity instead of traditional backpropagation.

### Modular Configuration:
The brain is segmented into biologically inspired sub-modules (`/src/sim/brain/modules/`):
* **Sensory / `chemoDecoder.js`**: Translates internal chemical frequencies (6–24 step pulse periods) into food types.
* **Sensory / `predatorLocator.js`**: Parses binaural acoustic input to determine inter-ear time delays for tracking predators.
* **Rhythm / `shelterTimer.js`**: An internal biological clock that anticipates the 800-step day/night cycle.
* **Memory / `valueMemory.js`**: Tracks and overrides nutritional groupings when food safety rules arbitrarily rotate every 600 steps.
* **Motor / `motorControl.js`**: Converts neural firing rates directly into 3 floating-point outputs: **thrust**, **turn_rate**, and **eat**.
* **`learningRule.js`**: Hebbian-style local synaptic plasticity orchestrating structural weight updates to handle drift.

---

## 4. The Bridge Layer (`simAPI.js` & `simContext.tsx`)
Because React's state cycles cannot handle calculating 164 neurons up to 60 times a second, we use a bridge:
* **`simAPI.js`**: Acts as the master controller exposing methods like `getStats()`, `start()`, and `toggleAblation()` to manipulate the core engine safely.
* **Zustand (`simContext.tsx`)**: Polling the `simAPI` periodically (every 100ms) to sync the React UI components dynamically without triggering re-renders inside the pure 3D canvas.

---

## 5. Visualization Layer (`/src/viz/` & `/src/components/`)
* **3D Views using Three.js**:
  * `worldView.js`: Renders the organism, predators, and food in a 3D visual pond.
  * `brainView.js`: Instantiates a 3D force-directed graph of the 164 active neurons. The links flash and color-grade dynamically depending on the current synaptic voltages in memory.
* **React Dashboard**:
  * Constructed using Tailwind CSS & Shadcn UI. Features modular panels:
  * `CentreMetrics.tsx`: Recharts-powered graphical analytics of energy over time and foraging accuracy.
  * `LeftControlPanel.tsx` & `RightBrainInspector.tsx`: Gives users direct ablation toggles and detailed neuron telemetry inspection.

---

## 6. AI Management Layer (`src/lib/aiService.ts`)
An extensible, modular wrapper added to introduce Large Language Model analysis dynamically into the dashboard. It exposes inputs for scenario building, strategy drift monitoring, trial coaching, and auto-ablation rankings.