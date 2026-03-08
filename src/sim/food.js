import { RingBuffer } from '../utils/ringBuffer.js';
import { torusDist, gaussNoise } from '../utils/math.js';
import { WORLD } from './world.js';

export class FoodManager {
  constructor() {
    // sources keyed by type: { A: [...], B: [...], C: [...], D: [...] }
    this.sources = {};
    for (const type of WORLD.FOOD_TYPES) {
      this.sources[type] = [];
    }
  }

  tick(t) {
    for (const type of WORLD.FOOD_TYPES) {
      for (const src of this.sources[type]) {
        // Countdown respawn
        if (src.respawnTimer > 0) {
          src.respawnTimer--;
          // Still push zero emission while dead
          src.emissionBuffer.push(0);
          continue;
        }
        // Push emission value
        const phase = t % src.period;
        const emission = Math.exp(-(phase * phase) / (2 * WORLD.FOOD_PULSE_SIGMA ** 2));
        src.emissionBuffer.push(emission);
      }
    }
  }

  computeChemicalSignal(cx, cy) {
    let signal = 0;
    for (const type of WORLD.FOOD_TYPES) {
      for (const src of this.sources[type]) {
        if (src.respawnTimer > 0) continue;
        const dx = torusDist(cx, src.x, WORLD.SIZE);
        const dy = torusDist(cy, src.y, WORLD.SIZE);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 40) continue; // max range for performance
        const delay = Math.round(d / WORLD.V_CHEM);
        const emissionDelayed = src.emissionBuffer.get(delay);
        signal += emissionDelayed / Math.max(d, 0.5);
      }
    }
    return signal + gaussNoise(WORLD.SENSOR_NOISE_SIGMA);
  }

  tryEat(cx, cy, eatDist) {
    for (const type of WORLD.FOOD_TYPES) {
      for (const src of this.sources[type]) {
        if (src.respawnTimer > 0) continue;
        const dx = torusDist(cx, src.x, WORLD.SIZE);
        const dy = torusDist(cy, src.y, WORLD.SIZE);
        if (Math.sqrt(dx * dx + dy * dy) < eatDist) {
          src.respawnTimer = WORLD.FOOD_RESPAWN_STEPS;
          return src;
        }
      }
    }
    return null;
  }

  nearestNutritiousPos(cx, cy, nutritionPhase) {
    let best = null, bestDist = Infinity;
    for (const type of nutritionPhase) {
      for (const src of this.sources[type]) {
        if (src.respawnTimer > 0) continue;
        const dx = torusDist(cx, src.x, WORLD.SIZE);
        const dy = torusDist(cy, src.y, WORLD.SIZE);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestDist) { bestDist = d; best = { x: src.x, y: src.y }; }
      }
    }
    return best;
  }

  reset(foodPositions) {
    for (const type of WORLD.FOOD_TYPES) {
      this.sources[type] = (foodPositions[type] || []).map(p => ({
        x: p.x, y: p.y, type,
        period: WORLD.FOOD_PULSE_PERIODS[type],
        respawnTimer: 0,
        emissionBuffer: new RingBuffer(50)
      }));
    }
  }

  getSnapshot() {
    const snap = {};
    for (const type of WORLD.FOOD_TYPES) {
      snap[type] = this.sources[type].map(s => ({
        x: s.x, y: s.y, alive: s.respawnTimer === 0
      }));
    }
    return snap;
  }
}
