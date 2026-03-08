import { World, WORLD, daylight } from './sim/world.js';
import { Network, buildDefaultBrain, HP } from './sim/brain/network.js';
import { TrialManager } from './sim/trial.js';
import { Scorer } from './sim/scorer.js';
import { on, emit } from './utils/eventBus.js';

// ── Module-scoped state (singleton) ────────────────────
let world, network, trialManager, scorer;
let worldView = null;
let brainView = null;
let _running = false;
let _timeScale = 1;
let _rafId = null;
let _highlightedModule = null;
let _ablationResults = [];
let _initialized = false;

// ── Internal helpers ───────────────────────────────────

function _startFirstTrial() {
  const config = trialManager.startNextTrial();
  world.reset(config);
  network.resetStates();
  scorer.reset();
}

function _onTrialEnd() {
  const metrics = scorer.getTrialMetrics();
  trialManager.recordTrialResult(metrics);

  if (trialManager.isComplete()) {
    emit('allTrialsComplete', trialManager.getAggregateScores());
  } else {
    const config = trialManager.startNextTrial();
    world.reset(config);
    network.resetStates();
    scorer.reset();
  }
}

function _computeStepsToNightfall() {
  const t = world.currentStep;
  const period = WORLD.DAY_PERIOD;
  const phase = t % period;
  if (phase < period / 2) {
    return Math.round(period / 2 - phase);
  } else {
    return Math.round(period + period / 2 - phase);
  }
}

function _loop() {
  if (!_running) return;

  const stepsPerFrame = Math.min(50, Math.round(_timeScale));
  for (let i = 0; i < stepsPerFrame; i++) {
    // 1. Build sensor vector
    const sensorVec = world.getSensorVector();

    // 2. Brain step → actions [thrust, turnRate, eat]
    const actions = network.step(sensorVec);

    // 3. World step
    world.tick(actions[0], actions[1], actions[2]);

    // 4. Scorer update
    scorer.update(world.getScorerState(), network);

    // 5. Check trial end
    if (world.currentStep >= WORLD.TRIAL_LENGTH) {
      emit('trialEnd');
      break;
    }
  }

  // Render
  if (worldView) {
    worldView.update(world.getState());
    worldView.render();
  }
  if (brainView) {
    brainView.update(network.getSnapshot());
    brainView.render();
  }

  _rafId = requestAnimationFrame(_loop);
}

// ── Public API (singleton object) ──────────────────────

export const simAPI = {
  /** Called by main.js to wire deps, or auto-inits with defaults */
  _init(deps) {
    if (deps) {
      ({ world, network, trialManager, scorer } = deps);
    } else {
      world = new World();
      network = new Network();
      trialManager = new TrialManager();
      scorer = new Scorer();
      buildDefaultBrain(network);
    }
    _ablationResults = [];
    _initialized = true;
    on('trialEnd', _onTrialEnd);
    _startFirstTrial();
  },

  get initialized() { return _initialized; },

  // ── Canvas mounting (async + window globals) ─────────
  async mountWorldCanvas(canvas) {
    const { WorldView } = await import('./viz/worldView.js');
    worldView = new WorldView(canvas);
    worldView.init();
    window._worldView = worldView;
  },

  async mountBrainCanvas(canvas) {
    const { BrainView } = await import('./viz/brainView.js');
    brainView = new BrainView(canvas);
    brainView.init(network);
    window._brainView = brainView;
  },

  // ── Control ──────────────────────────────────────────
  start() {
    if (_running) return;
    _running = true;
    _loop();
  },

  pause() {
    _running = false;
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  },

  reset() {
    simAPI.pause();
    trialManager = new TrialManager();
    network.resetFull();
    buildDefaultBrain(network);
    _ablationResults = [];
    _startFirstTrial();
  },

  setTimeScale(m) {
    _timeScale = Math.max(0.1, Math.min(10, m));
  },

  setScenario(name) {
    world.setScenario(name);
  },

  // ── Module & Ablation ────────────────────────────────
  toggleModule(name) {
    _highlightedModule = _highlightedModule === name ? null : name;
    if (brainView) brainView.setModuleHighlight(_highlightedModule);
  },

  toggleAblation(name) {
    if (name === 'learning') {
      network._learningDisabled = !network._learningDisabled;
      _ablationResults.push({
        type: 'learning',
        disabled: network._learningDisabled,
        step: world.currentStep,
        trial: trialManager.currentTrial
      });
    } else {
      const idx = network._ablatedModules.indexOf(name);
      if (idx >= 0) {
        network._ablatedModules.splice(idx, 1);
      } else {
        network._ablatedModules.push(name);
      }
      _ablationResults.push({
        type: 'module',
        module: name,
        ablated: network._ablatedModules.includes(name),
        step: world.currentStep,
        trial: trialManager.currentTrial
      });
    }
  },

  // ── Data ─────────────────────────────────────────────
  exportData() {
    import('./utils/docExporter.js').then(({ exportSubmissionData }) => {
      exportSubmissionData(simAPI);
    });
  },

  getStats() {
    const state = world.getState();
    const dl = daylight(world.currentStep);
    const stepsToNight = _computeStepsToNightfall();
    return {
      step: world.currentStep,
      trial: trialManager.currentTrial,
      totalTrials: WORLD.TOTAL_TRIALS,
      creature: state.creature,
      daylight: dl,
      isNight: dl < 0.5,
      stepsToNightfall: stepsToNight,
      nutritionPhase: state.nutritionPhase,
      nutritionTypes: state.nutritiousTypes,
      scorer: scorer.getTrialMetrics(),
      scorerHistory: scorer.getHistoryForCharts(),
      brainActivity: network.getActivityStats(),
      neuronCount: network.neurons.filter(n => n.type !== 'input').length,
      connectionCount: network.connections.length,
      M1: network.M1,
      M2: network.M2,
      timeScale: _timeScale,
      running: _running,
      ablations: {
        learningDisabled: network._learningDisabled,
        ablatedModules: [...network._ablatedModules]
      },
      // Gap 2: sensor history for Lovable UI charts
      chemicalHistory: world._chemicalHistory.toArray(),
      acousticLHistory: world._acousticLHistory.toArray(),
      acousticRHistory: world._acousticRHistory.toArray(),
      predatorHitSteps: world._predatorHitSteps.slice(-20)
    };
  },

  getSnapshot() {
    return network.getSnapshot();
  },

  // ── Direct references for docExporter ────────────────
  get world() { return world; },
  get network() { return network; },
  get trialManager() { return trialManager; },
  get scorer() { return scorer; },
  get _ablationResults() { return _ablationResults; }
};
