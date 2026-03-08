import { torusWrap, torusDist, torusVec2, vec2Norm, vec2Len, gaussNoise, clamp } from '../utils/math.js';
import { emit } from '../utils/eventBus.js';
import { RingBuffer } from '../utils/ringBuffer.js';
import { FoodManager } from './food.js';
import { PredatorManager } from './predator.js';
import { buildSensorVector } from './sensors.js';

export const WORLD = {
  SIZE: 100,
  DT: 1,
  TRIAL_LENGTH: 20000,
  TOTAL_TRIALS: 30,
  MASS: 1.0,
  DRAG: 0.3,
  V_CHEM: 2.0,
  V_SOUND: 5.0,
  FOOD_TYPES: ['A', 'B', 'C', 'D'],
  FOOD_COUNT: 30,
  FOOD_RESPAWN_STEPS: 80,
  FOOD_ENERGY_NUTRITIOUS: 40,
  FOOD_ENERGY_TOXIC: -25,
  FOOD_PULSE_PERIODS: { A: 6, B: 10, C: 16, D: 24 },
  FOOD_PULSE_SIGMA: 1.0,
  NUTRITION_ROTATION_STEPS: 600,
  NUTRITION_SEQUENCE: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']],
  PREDATOR_COUNT: 3,
  PREDATOR_DAMAGE: -50,
  PREDATOR_HIT_DISTANCE: 3.0,
  PREDATOR_FREQ: 47,
  SHELTER_COUNT: 2,
  SHELTER_RADIUS: 5.0,
  SHELTER_ENERGY_RATE: 0.1,
  OUTSIDE_NIGHT_ENERGY: -0.15,
  DAY_PERIOD: 800,
  TIDE_PERIOD: 2000,
  SENSOR_NOISE_SIGMA: 0.02,
  PROXIMITY_NOISE_SIGMA: 0.3,
  RAY_COUNT: 8,
  RAY_RANGE: 6.0,
  EAR_OFFSET: 0.3,
  MAX_NEURONS: 500,
  MAX_CONNECTIONS: 10000,
  MAX_LOOKUP_ENTRIES: 100,
  MAX_ENERGY: 300,
  EAT_DISTANCE: 1.5,
  EAT_THRESHOLD: 0.5,
  REWARD_DURATION: 5
};

export function daylight(t) {
  return 0.5 + 0.5 * Math.sin(2 * Math.PI * t / WORLD.DAY_PERIOD);
}

export function current(x, y, t) {
  const tidal = { x: 0.15 * Math.sin(2 * Math.PI * t / WORLD.TIDE_PERIOD), y: 0 };
  const vortices = [
    { cx: 25, cy: 25, strength: 0.3, omega: 0.002 },
    { cx: 75, cy: 75, strength: 0.2, omega: -0.003 }
  ];
  let fx = tidal.x, fy = tidal.y;
  for (const v of vortices) {
    const dx = torusWrap(x - v.cx + WORLD.SIZE / 2, WORLD.SIZE) - WORLD.SIZE / 2;
    const dy = torusWrap(y - v.cy + WORLD.SIZE / 2, WORLD.SIZE) - WORLD.SIZE / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mag = v.strength / (dist + 0.5);
    fx += -dy / (dist + 0.5) * mag;
    fy +=  dx / (dist + 0.5) * mag;
  }
  return { x: fx, y: fy };
}

export class World {
  constructor() {
    this.currentStep = 0;
    this.creature = {
      x: 50, y: 50, theta: 0,
      vx: 0, vy: 0,
      energy: 150,
      hunger: 0,
      lastReward: 0,
      rewardTimer: 0
    };
    this.foods = new FoodManager();
    this.predators = new PredatorManager();
    this.shelters = [
      { x: 20, y: 20, radius: WORLD.SHELTER_RADIUS },
      { x: 80, y: 80, radius: WORLD.SHELTER_RADIUS }
    ];
    this.nutritionPhaseIndex = 0;
    this.nutritionPhase = WORLD.NUTRITION_SEQUENCE[0];
    this.eventLog = [];
    this.scenarioMods = { energyDrainMult: 1.0, chemNoiseMult: 1.0, foodNutritionMult: 1.0 };
    this.stepsAlive = 0;
    this.totalSteps = 0;
    this._nearestGoalPos = null;
    this._prevInShelter = false;
    // Gap 2: sensor history for Lovable UI charts
    this._chemicalHistory = new RingBuffer(100);
    this._acousticLHistory = new RingBuffer(100);
    this._acousticRHistory = new RingBuffer(100);
    this._predatorHitSteps = [];
  }

  tick(thrust, turnRate, eat) {
    const t = this.currentStep;
    const c = this.creature;

    // 1. Nutrition rotation check
    if (t > 0 && t % WORLD.NUTRITION_ROTATION_STEPS === 0) {
      this.nutritionPhaseIndex = (this.nutritionPhaseIndex + 1) % 4;
      this.nutritionPhase = WORLD.NUTRITION_SEQUENCE[this.nutritionPhaseIndex];
      emit('nutritionRotation', { newPhase: this.nutritionPhase, step: t });
      this._logEvent(`[t=${t}] Nutrition: ${this.nutritionPhase.join('')}`);
    }

    // 2. Day/night
    const dl = daylight(t);
    const isNight = dl < 0.3;

    // 3. Physics
    c.theta += clamp(turnRate, -Math.PI / 6, Math.PI / 6);
    const cur = current(c.x, c.y, t);
    const FnetX = thrust * Math.cos(c.theta) + cur.x - WORLD.DRAG * c.vx;
    const FnetY = thrust * Math.sin(c.theta) + cur.y - WORLD.DRAG * c.vy;
    c.vx = c.vx + FnetX / WORLD.MASS;
    c.vy = c.vy + FnetY / WORLD.MASS;
    c.x = torusWrap(c.x + c.vx * WORLD.DT, WORLD.SIZE);
    c.y = torusWrap(c.y + c.vy * WORLD.DT, WORLD.SIZE);

    // 4. Food emission tick and eat check
    this.foods.tick(t);
    if (eat > WORLD.EAT_THRESHOLD) {
      const foodHit = this.foods.tryEat(c.x, c.y, WORLD.EAT_DISTANCE);
      if (foodHit) {
        const isNutritious = this.nutritionPhase.includes(foodHit.type);
        const energyDelta = isNutritious
          ? WORLD.FOOD_ENERGY_NUTRITIOUS * this.scenarioMods.foodNutritionMult
          : WORLD.FOOD_ENERGY_TOXIC;
        c.energy += energyDelta;
        c.lastReward = isNutritious ? 1 : -1;
        c.rewardTimer = WORLD.REWARD_DURATION;
        c.hunger = Math.max(0, c.hunger - 0.3);
        const evtType = isNutritious ? 'nutritiousEat' : 'toxicEat';
        emit(evtType, { foodType: foodHit.type, step: t });
        this._logEvent(`[t=${t}] ${isNutritious ? '✓' : '✗'} Eat ${foodHit.type} ${energyDelta > 0 ? '+' : ''}${Math.round(energyDelta)}`);
      }
    }

    // 5. Predators tick + hit check
    this.predators.tick(t);
    const predHit = this.predators.checkHit(c.x, c.y, WORLD.PREDATOR_HIT_DISTANCE);
    if (predHit) {
      c.energy += WORLD.PREDATOR_DAMAGE;
      emit('predatorHit', { energy: c.energy, step: t });
      this._logEvent(`[t=${t}] ⚡ Predator hit! ${WORLD.PREDATOR_DAMAGE}`);
      this._predatorHitSteps.push(t);
      predHit.teleport();
    }

    // 6. Shelter / night energy
    const inShelter = this._inAnyShelter(c.x, c.y);
    if (inShelter && !this._prevInShelter) emit('shelterEnter', { step: t });
    if (!inShelter && this._prevInShelter) emit('shelterExit', { step: t });
    this._prevInShelter = inShelter;

    if (isNight) {
      if (inShelter) {
        c.energy += WORLD.SHELTER_ENERGY_RATE;
      } else {
        c.energy += WORLD.OUTSIDE_NIGHT_ENERGY * this.scenarioMods.energyDrainMult;
      }
    }

    // 7. Reward timer countdown
    if (c.rewardTimer > 0) {
      c.rewardTimer--;
    } else {
      c.lastReward = 0;
    }

    // 8. Hunger increases over time
    c.hunger = Math.min(1, c.hunger + 0.0005);

    // 9. Energy floor and cap
    c.energy = Math.max(0, Math.min(WORLD.MAX_ENERGY, c.energy));

    // 10. Survival tracking
    this.totalSteps++;
    if (c.energy > 0) this.stepsAlive++;

    // 11. Nearest nutritious food for scorer
    this._nearestGoalPos = this.foods.nearestNutritiousPos(c.x, c.y, this.nutritionPhase);

    // 12. Record sensor history for UI charts (Gap 2)
    const sv = this.getSensorVector();
    this._chemicalHistory.push(sv[0]);
    this._acousticLHistory.push(sv[1]);
    this._acousticRHistory.push(sv[2]);

    this.currentStep++;
  }

  _inAnyShelter(x, y) {
    return this.shelters.some(s => {
      const dx = torusDist(x, s.x, WORLD.SIZE);
      const dy = torusDist(y, s.y, WORLD.SIZE);
      return Math.sqrt(dx * dx + dy * dy) < s.radius;
    });
  }

  _logEvent(msg) {
    this.eventLog.push(msg);
    if (this.eventLog.length > 200) this.eventLog.shift();
  }

  getSensorVector() {
    return buildSensorVector(this);
  }

  getState() {
    const dl = daylight(this.currentStep);
    return {
      creature: { ...this.creature },
      foods: this.foods.getSnapshot(),
      predators: this.predators.getSnapshot(),
      shelters: this.shelters,
      daylight: dl,
      isNight: dl < 0.3,
      inShelter: this._inAnyShelter(this.creature.x, this.creature.y),
      nutritionPhase: this.nutritionPhase,
      nutritiousTypes: WORLD.NUTRITION_SEQUENCE[this.nutritionPhaseIndex] || WORLD.NUTRITION_SEQUENCE[0],
      step: this.currentStep,
      current: current(this.creature.x, this.creature.y, this.currentStep)
    };
  }

  getScorerState() {
    const dl = daylight(this.currentStep);
    return {
      energy: this.creature.energy,
      isNight: dl < 0.3,
      inShelter: this._inAnyShelter(this.creature.x, this.creature.y),
      pos: { x: this.creature.x, y: this.creature.y },
      nearestGoalPos: this._nearestGoalPos
    };
  }

  reset(config) {
    this.currentStep = 0;
    this.stepsAlive = 0;
    this.totalSteps = 0;
    this.eventLog = [];
    this._prevInShelter = false;
    this.nutritionPhaseIndex = config.nutritionStartPhase;
    this.nutritionPhase = WORLD.NUTRITION_SEQUENCE[config.nutritionStartPhase];
    this.creature = {
      x: config.creatureStart.x, y: config.creatureStart.y,
      theta: config.creatureStart.theta,
      vx: 0, vy: 0, energy: 150, hunger: 0, lastReward: 0, rewardTimer: 0
    };
    this.shelters = config.shelterPositions.map(p => ({ ...p, radius: WORLD.SHELTER_RADIUS }));
    this.foods.reset(config.foodPositions);
    this.predators.reset(config.predatorParams);
    this._nearestGoalPos = null;
    // Gap 2: reset sensor histories
    this._chemicalHistory = new RingBuffer(100);
    this._acousticLHistory = new RingBuffer(100);
    this._acousticRHistory = new RingBuffer(100);
    this._predatorHitSteps = [];
  }

  setScenario(name) {
    if (name === 'baseline')  this.scenarioMods = { energyDrainMult: 1.0, chemNoiseMult: 1.0, foodNutritionMult: 1.0 };
    if (name === 'heatwave')  this.scenarioMods = { energyDrainMult: 1.8, chemNoiseMult: 1.2, foodNutritionMult: 0.85 };
    if (name === 'polluted')  this.scenarioMods = { energyDrainMult: 1.3, chemNoiseMult: 2.5, foodNutritionMult: 1.0 };
  }
}
