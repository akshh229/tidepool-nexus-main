import { RingBuffer } from '../utils/ringBuffer.js';
import { torusDist } from '../utils/math.js';
import { WORLD } from './world.js';

export class Scorer {
  constructor() { this.reset(); }

  reset() {
    this.stepsAlive = 0;
    this.totalSteps = 0;
    this.correctEats = 0;
    this.toxicEats = 0;
    this.totalEats = 0;
    this.predatorHits = 0;
    this.nightSteps = 0;
    this.nightInShelterSteps = 0;
    this.totalPathLength = 0;
    this.straightLineSum = 0;
    this.activityCostSum = 0;
    this.neuronCount = 0;
    this.eatWindow = [];
    this.rotationAdaptSteps = [];
    this.stepsAfterRotation = null;
    this.trackingAdaptation = false;
    this.prevPos = null;
    this.energyHistory = new RingBuffer(500);
    this.correctEatHistory = new RingBuffer(500);
    this.activityHistory = new RingBuffer(500);
    this._rollingCorrect = 0;
  }

  update({ energy, isNight, inShelter, pos, nearestGoalPos }, { activityThisStep, neuronCount }) {
    this.totalSteps++;
    if (energy > 0) this.stepsAlive++;
    if (isNight) {
      this.nightSteps++;
      if (inShelter) this.nightInShelterSteps++;
    }
    if (pos && this.prevPos) {
      const dx = torusDist(pos.x, this.prevPos.x, WORLD.SIZE);
      const dy = torusDist(pos.y, this.prevPos.y, WORLD.SIZE);
      this.totalPathLength += Math.sqrt(dx * dx + dy * dy);
    }
    if (pos && nearestGoalPos) {
      const gx = torusDist(pos.x, nearestGoalPos.x, WORLD.SIZE);
      const gy = torusDist(pos.y, nearestGoalPos.y, WORLD.SIZE);
      this.straightLineSum += Math.sqrt(gx * gx + gy * gy);
    }
    if (pos) this.prevPos = { ...pos };
    this.activityCostSum += activityThisStep;
    this.neuronCount = neuronCount;
    if (this.trackingAdaptation && this.stepsAfterRotation !== null)
      this.stepsAfterRotation++;
    // History rings
    this.energyHistory.push(energy);
    this._rollingCorrect = this.totalEats > 0
      ? (this.correctEats / this.totalEats) : 0;
    this.correctEatHistory.push(this._rollingCorrect * 100);
    this.activityHistory.push(activityThisStep);
  }

  recordEat(isCorrect) {
    this.totalEats++;
    if (isCorrect) this.correctEats++; else this.toxicEats++;
    this.eatWindow.push(isCorrect ? 1 : 0);
    if (this.eatWindow.length > 30) this.eatWindow.shift();
    if (this.trackingAdaptation && this.eatWindow.length >= 10) {
      const acc = this.eatWindow.reduce((s, v) => s + v, 0) / this.eatWindow.length;
      if (acc > 0.75) {
        this.rotationAdaptSteps.push(this.stepsAfterRotation);
        this.trackingAdaptation = false;
      }
    }
  }

  onNutritionRotation() {
    this.stepsAfterRotation = 0;
    this.trackingAdaptation = true;
    this.eatWindow = [];
  }

  recordPredatorHit() { this.predatorHits++; }

  getTrialMetrics() {
    const T = this.totalSteps || 1;
    const survivalFraction = this.stepsAlive / T;
    const foragingAccuracy = this.totalEats > 0
      ? (this.correctEats - this.toxicEats) / this.totalEats : 0;
    const meanAdaptSteps = this.rotationAdaptSteps.length > 0
      ? this.rotationAdaptSteps.reduce((s, v) => s + v, 0) / this.rotationAdaptSteps.length
      : T;
    const adaptationScore = 1 / Math.log(meanAdaptSteps + Math.E);
    const randomBaselineHits = 3 * Math.PI * (WORLD.PREDATOR_HIT_DISTANCE ** 2)
      / (WORLD.SIZE ** 2) * T;
    const predatorAvoidance = Math.max(0, Math.min(1, 1 - (this.predatorHits / Math.max(randomBaselineHits, 1))));
    const shelterTiming = this.nightSteps > 0
      ? this.nightInShelterSteps / this.nightSteps : 1;
    const navigationEfficiency = Math.min(1, this.totalPathLength > 0
      ? this.straightLineSum / this.totalPathLength : 0);
    const activityCostAvg = this.activityCostSum / T;
    const funcPerf = (survivalFraction + Math.max(foragingAccuracy, 0) + shelterTiming) / 3;
    const activityEfficiency = funcPerf / Math.max(activityCostAvg * this.neuronCount, 0.001);
    return {
      survivalFraction, foragingAccuracy, adaptationScore,
      predatorAvoidance, shelterTiming, navigationEfficiency,
      activityEfficiency, activityCostAvg,
      correctEats: this.correctEats, toxicEats: this.toxicEats,
      predatorHits: this.predatorHits,
      rotationAdaptSteps: [...this.rotationAdaptSteps]
    };
  }

  getHistoryForCharts() {
    return {
      energy: this.energyHistory.toArray(),
      correctEatPct: this.correctEatHistory.toArray(),
      activity: this.activityHistory.toArray()
    };
  }
}
