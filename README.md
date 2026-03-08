# 🧠 The Tidepool Brain
### A Modular Neural Controller with 3D Visualization
**HACKBIO '26 Submission** — Kamand Bioengineering Group
## 👥 Team Name;- SYNTHETIC MINDS 
---

## 🌊 Overview

The Tidepool Brain is a biologically-inspired neural controller that guides a
creature through a dynamic 2D tidepool environment. The creature must forage
for food, avoid predators, seek shelter during night cycles, and adapt its
foraging strategy when nutritional mappings change — all using a custom-built
modular brain with 164 neurons and 330 connections.

The project features a full real-time 3D visualization dashboard built with
React + Three.js, showing the creature's world and neural activity simultaneously.

---

## 🎯 Problem Statement

Design a computational brain from first principles that:
- Discriminates food types via chemical signal frequency (6–24 step pulse periods)
- Localises predators using binaural acoustic input (inter-ear time delay)
- Anticipates the day/night cycle (T = 800 steps) to seek shelter proactively
- Re-learns nutrition mappings every 600 steps after rotation (AB→BC→CD→DA)
- Produces smooth continuous motor control in a momentum-based world with currents
- Minimises neural activity cost while maximising functional performance

---

## 🧬 Brain Architecture

| Property | Value |
|---|---|
| Neuron Count | 164 |
| Connections | 330 |
| Input Vector | 30 floats/timestep |
| Output Vector | 3 floats (thrust, turn_rate, eat) |
| Trial Length | 20,000 steps |
| Learning Rule | Local synaptic plasticity (no backprop) |

### Brain Modules
- **Sensory Module** — processes chemical, acoustic, and proximity inputs
- **Motor Module** — outputs thrust, turn rate, and eat action
- **Memory Module** — tracks nutrition rotation state
- **Rhythm Module** — encodes day/night cycle anticipation
- **Learning Module** — synaptic weight updates via local Hebbian-style rule

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Shadcn UI |
| State | Zustand |
| Charts | Recharts |
| 3D World | Three.js (worldView.js) |
| 3D Brain | Three.js (brainView.js) |
| Sim Engine | Vanilla JS (src/sim/) |
| Bridge | simAPI.js |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tidepool-nexus-main.git
cd tidepool-nexus-main

# Install dependencies
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🎮 Controls

| Key | Action |
|---|---|
| `Space` | Start / Stop simulation |
| `R` | Reset simulation |

---

## 📁 Project Structure

```
tidepool-nexus-main/
├── index.html                        # App entry HTML
├── vite.config.ts                    # Vite build config (esnext, Three.js optimized)
├── tsconfig.json                     # TypeScript config (allowJs, bundler resolution)
├── tailwind.config.ts                # Tailwind CSS config
├── package.json                      # Dependencies & scripts
│
├── src/
│   ├── main.tsx                      # 🚀 App bootstrap — init brain + mount React
│   ├── simAPI.js                     # 🌉 Bridge — connects sim engine to React UI
│   ├── index.css                     # Global styles
│   │
│   ├── ── FRONTEND ──────────────────────────────────────────
│   │
│   ├── pages/
│   │   └── Index.tsx                 # Root page — assembles full dashboard layout
│   │
│   ├── components/
│   │   ├── TopHeaderBar.tsx          # Title, step counter, trial info bar
│   │   ├── WorldCanvas.tsx           # Three.js tidepool world mount point
│   │   ├── BrainCanvas.tsx           # Three.js neural network mount point
│   │   ├── LeftControlPanel.tsx      # Scenario selector, ablation toggles
│   │   ├── RightBrainInspector.tsx   # Live neuron firing, module activations
│   │   ├── BottomHUD.tsx             # Recharts live energy/score charts
│   │   ├── CentreMetrics.tsx         # Central KPI metrics display
│   │   └── KeyboardShortcuts.tsx     # Space=start/stop, R=reset bindings
│   │
│   ├── lib/
│   │   ├── simContext.tsx            # Zustand store — polls simAPI every 100ms
│   │   └── mockSimAPI.ts             # (Legacy) original mock — no longer used
│   │
│   ├── ── BACKEND / SIM ENGINE ──────────────────────────────
│   │
│   ├── sim/
│   │   ├── world.js                  # World state, physics, toroidal grid
│   │   ├── food.js                   # 4 food types, chemical pulse emissions
│   │   ├── predator.js               # 3 predators on Lissajous patrol paths
│   │   ├── sensors.js                # 30-float sensor vector per timestep
│   │   ├── trial.js                  # TrialManager — 20,000 step trial loop
│   │   ├── scorer.js                 # Fitness: survival, foraging, avoidance
│   │   └── brain/
│   │       ├── network.js            # Neural network (164 neurons, 330 connections)
│   │       ├── neuron.js             # Discrete-time neuron dynamics
│   │       ├── learningRule.js       # Local synaptic plasticity (no backprop)
│   │       └── modules/              # Sensory, motor, memory, rhythm modules
│   │
│   ├── viz/
│   │   ├── worldView.js              # Three.js 3D tidepool scene renderer
│   │   └── brainView.js              # Three.js brain network visualizer
│   │
│   └── utils/                        # Shared math/helper utilities
```

---

## 📊 Scoring Metrics

| Metric | Max Points | Description |
|---|---|---|
| Survival | 8 | Mean fraction of 20,000 steps survived |
| Foraging Accuracy | 8 | Correct eats vs toxic eats ratio |
| Adaptation Speed | 8 | Steps to recover after nutrition rotation |
| Predator Avoidance | 6 | Hits vs random baseline |
| Shelter Timing | 6 | Night steps spent inside shelter |
| Navigation Efficiency | 6 | Straight-line vs actual distance |
| Activity Efficiency | 8 | Performance / (activity cost × neuron count) |
| **Design Score** | **50** | Judged on architecture rationale and analysis |

---

## 👥 Team Name;- SYNTHETIC MINDS 

Built for **HACKBIO '26** — 12-hour computational hackathon
**Track:** Neuron Design, Network Architecture & Learning Rule Engineering

---

## 📄 License

MIT License — built for academic/competition purposes.
