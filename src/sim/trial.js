function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class TrialManager {
  constructor(totalTrials = 30) {
    this.totalTrials = totalTrials;
    this.currentTrial = 0;
    this.trialResults = [];
  }

  generateTrialConfig(trialIndex) {
    const rng = mulberry32(trialIndex * 1234567 + 42);
    return {
      seed: trialIndex,
      foodPositions: Object.fromEntries(
        ['A', 'B', 'C', 'D'].map(type => [type,
          Array.from({ length: Math.ceil(30 / 4) }, () => ({ x: rng() * 100, y: rng() * 100 }))
        ])
      ),
      nutritionStartPhase: Math.floor(rng() * 4),
      predatorParams: Array.from({ length: 3 }, () => ({
        cx: 20 + rng() * 60, cy: 20 + rng() * 60,
        Ax: 10 + rng() * 20, Ay: 10 + rng() * 20,
        wx: 0.002 + rng() * 0.006, wy: 0.003 + rng() * 0.006,
        phx: rng() * Math.PI * 2, phy: rng() * Math.PI * 2
      })),
      shelterPositions: [
        { x: 15 + rng() * 20, y: 15 + rng() * 20 },
        { x: 65 + rng() * 20, y: 65 + rng() * 20 }
      ],
      creatureStart: { x: rng() * 100, y: rng() * 100, theta: rng() * Math.PI * 2 }
    };
  }

  startNextTrial(world, network) {
    const config = this.generateTrialConfig(this.currentTrial);
    world.reset(config);
    network.resetStates();
    return config;
  }

  recordTrialResult(metrics) {
    this.trialResults.push({ trial: this.currentTrial, ...metrics });
    this.currentTrial++;
  }

  isComplete() {
    return this.currentTrial >= this.totalTrials;
  }

  getAggregateScores() {
    if (this.trialResults.length === 0) return null;
    const keys = Object.keys(this.trialResults[0]).filter(k => k !== 'trial');
    const avg = {};
    for (const k of keys) {
      const vals = this.trialResults.map(r => r[k]);
      if (typeof vals[0] === 'number') {
        avg[k] = vals.reduce((s, v) => s + v, 0) / vals.length;
      }
    }
    return avg;
  }
}
