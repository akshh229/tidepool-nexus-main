import { RingBuffer } from '../../utils/ringBuffer.js';
import { clamp } from '../../utils/math.js';
import { Neuron, NeuronR, NeuronO } from './neuron.js';
import { HP, applyLearningRule } from './learningRule.js';
import { WORLD } from '../world.js';

export { HP };

export const SENSOR_MAP = {
  chemical:   0,
  acousticL:  1,
  acousticR:  2,
  ray:    (i) => 3 + i * 2,
  rayType:(i) => 4 + i * 2,
  shelterU1x: 19, shelterU1y: 20,
  shelterU2x: 21, shelterU2y: 22,
  speed: 23, theta: 24, vx: 25, vy: 26,
  energy: 27, hunger: 28, reward: 29
};

export class Network {
  constructor() {
    this.neurons = [];
    this.connections = [];
    this.inputNeuronIds = [];
    this.outputIds = {};
    this.M1 = 0;
    this.M2 = 0;
    this._expectedReward = 0;
    this._prevEnergy = null;
    this.activityThisStep = 0;
    this.activityCostSum = 0;
    this.stepCount = 0;
    this._weightHistories = new Map();
    this._learningDisabled = false;
    this._ablatedModules = [];
  }


  get neuronCount() { return this.neurons.filter(n => n.type !== 'input').length; }
  addNeuron(module, type, params) {
    if (this.neurons.length >= WORLD.MAX_NEURONS) {
      console.warn('NEURON CAP REACHED (500) — skipping');
      return null;
    }
    let neuron;
    if (type === 'input') {
      neuron = new Neuron(this.neurons.length, module, 'input', params);
    } else if (type === 'R') {
      neuron = new NeuronR(this.neurons.length, module, params);
    } else if (type === 'O') {
      neuron = new NeuronO(this.neurons.length, module, params);
    }
    this.neurons.push(neuron);
    return neuron.id;
  }

  addConnection(fromId, toId, weight, delay = 0) {
    if (this.connections.length >= WORLD.MAX_CONNECTIONS) {
      console.warn('CONNECTION CAP REACHED (10000) — skipping');
      return;
    }
    delay = Math.max(0, Math.round(delay));
    this.connections.push({
      fromId, toId, weight,
      delay,
      delayBuffer: new RingBuffer(Math.max(delay + 2, 4))
    });
  }

  step(sensorVector) {
    // 1. Inject sensors into input neurons
    for (let i = 0; i < 30; i++)
      this.neurons[this.inputNeuronIds[i]].output = sensorVector[i];

    // 2. Deliver delayed signals per connection
    const inputAccum = new Float64Array(this.neurons.length);
    for (const c of this.connections) {
      c.delayBuffer.push(this.neurons[c.fromId].output);
      inputAccum[c.toId] += c.delayBuffer.get(c.delay) * c.weight;
    }

    // 3. Step each non-input neuron (with ablation support — Fix 5)
    for (const n of this.neurons) {
      if (n.type === 'input') continue;
      if (this._ablatedModules.length > 0 && this._ablatedModules.includes(n.module)) {
        n.output = 0;
        continue;
      }
      n.step([inputAccum[n.id]]);
    }

    // 4. Compute activity cost
    this.activityThisStep = 0;
    for (const n of this.neurons)
      if (n.type !== 'input') this.activityThisStep += Math.abs(n.output);
    if (!isFinite(this.activityThisStep)) this.activityThisStep = 0;
    this.activityCostSum += this.activityThisStep;
    this.stepCount++;

    // 5. Update modulators
    const reward = sensorVector[29];
    const energyDelta = sensorVector[27] - (this._prevEnergy ?? sensorVector[27]);
    this._prevEnergy = sensorVector[27];
    const rewardSignal = reward + energyDelta;
    this.M1 += HP.M1_EMA_ALPHA * (rewardSignal - this.M1);
    const surprise = Math.abs(reward - this._expectedReward) + Math.max(-energyDelta * 5, 0);
    this.M2 += HP.M2_EMA_ALPHA * (surprise - this.M2);
    this._expectedReward += 0.02 * (reward - this._expectedReward);

    // 6. Apply learning rule (with disabled check — Fix 5)
    if (!this._learningDisabled) {
      for (let ci = 0; ci < this.connections.length; ci++) {
        const c = this.connections[ci];
        if (this.neurons[c.fromId].type === 'input') continue;
        applyLearningRule(c, this.neurons[c.fromId].output,
          this.neurons[c.toId].output, this.M1, this.M2);
        if (!this._weightHistories.has(ci))
          this._weightHistories.set(ci, new RingBuffer(100));
        this._weightHistories.get(ci).push(c.weight);
      }
    }

    // 7. Return actions
    return [
      clamp(this.neurons[this.outputIds.thrust].output, -1, 1),
      clamp(this.neurons[this.outputIds.turnRate].output, -Math.PI / 6, Math.PI / 6),
      clamp(this.neurons[this.outputIds.eat].output, 0, 1)
    ];
  }

  resetStates() {
    for (const n of this.neurons) {
      n.state = n.state.map(() => 0);
      n.output = 0;
    }
    for (const c of this.connections) {
      c.delayBuffer.buf.fill(0);
      c.delayBuffer.head = 0;
    }
    this.M1 = 0;
    this.M2 = 0;
    this.activityCostSum = 0;
    this.stepCount = 0;
    this._prevEnergy = null;
    this._expectedReward = 0;
    this.activityThisStep = 0;
  }

  resetFull() {
    this.resetStates();
    for (const c of this.connections)
      c.weight = (Math.random() * 2 - 1) * HP.INIT_WEIGHT_RANGE;
  }

  getSnapshot() {
    // Gap 3: compute per-module neuron counts for Lovable brain chip badges
    const moduleNeuronCounts = { chemo: 0, predator: 0, shelter: 0, value: 0, motor: 0 };
    for (const n of this.neurons) {
      if (n.type === 'input') continue;
      if (moduleNeuronCounts[n.module] !== undefined)
        moduleNeuronCounts[n.module]++;
    }
    return {
      neurons: this.neurons.map(n => ({
        id: n.id, module: n.module, type: n.type,
        output: n.output, position3D: n.position3D
      })),
      connections: this.connections
        .map((c, i) => ({ fromId: c.fromId, toId: c.toId, weight: c.weight, idx: i }))
        .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
        .slice(0, 500),
      activityThisStep: this.activityThisStep,
      neuronCount: this.neurons.filter(n => n.type !== 'input').length,
      moduleNeuronCounts,
      M1: this.M1, M2: this.M2
    };
  }

  getActivityStats() {
    const modules = {};
    for (const n of this.neurons) {
      if (n.type === 'input') continue;
      if (!modules[n.module]) modules[n.module] = { sum: 0, count: 0 };
      modules[n.module].sum += Math.abs(n.output);
      modules[n.module].count++;
    }
    const result = {};
    for (const [mod, data] of Object.entries(modules))
      result[mod] = data.count > 0 ? data.sum / data.count : 0;
    return result;
  }

  getWeightHistories() {
    const obj = {};
    for (const [ci, rb] of this._weightHistories)
      obj[ci] = rb.toArray();
    return obj;
  }

  getWiringDiagram() {
    const pairs = {};
    for (const c of this.connections) {
      const fromMod = this.neurons[c.fromId].module;
      const toMod = this.neurons[c.toId].module;
      const key = `${fromMod}->${toMod}`;
      if (!pairs[key]) pairs[key] = { count: 0, avgWeight: 0 };
      pairs[key].count++;
      pairs[key].avgWeight += Math.abs(c.weight);
    }
    for (const v of Object.values(pairs))
      if (v.count > 0) v.avgWeight /= v.count;
    return pairs;
  }
}

// ═══════════════════════════════════════════════════════
// buildDefaultBrain — wire all 5 modules
// ═══════════════════════════════════════════════════════

export function buildDefaultBrain(network) {
  if (network.neurons.length > 0) return;
  // ── 30 INPUT NEURONS ─────────────────────────────────
  const inputIds = [];
  for (let i = 0; i < 30; i++)
    inputIds.push(network.addNeuron('input', 'input', {}));
  network.inputNeuronIds = inputIds;

  // ── MODULE 1: CHEMO DECODER (~36 neurons) ────────────
  const FOOD_PERIODS = [6, 10, 16, 24];
  const chemoPoolIds = [[], [], [], []];
  for (let typeIdx = 0; typeIdx < 4; typeIdx++) {
    const T = FOOD_PERIODS[typeIdx];
    for (let k = 0; k < 8; k++) {
      const decayVal = k < 4 ? 0.95 : 0.99;
      const nid = network.addNeuron('chemo', 'O', {
        omega: 2 * Math.PI / T,
        decay: decayVal,
        coupling: 0.8
      });
      network.addConnection(inputIds[SENSOR_MAP.chemical], nid, 0.5, Math.round(T / 4));
      chemoPoolIds[typeIdx].push(nid);
    }
  }
  // 4 evidence neurons with lateral inhibition
  const foodEvidenceIds = [];
  for (let typeIdx = 0; typeIdx < 4; typeIdx++) {
    const eid = network.addNeuron('chemo', 'R', { leak: 0.85 });
    foodEvidenceIds.push(eid);
    for (const src of chemoPoolIds[typeIdx])
      network.addConnection(src, eid, 0.3, HP.CHEMO_DELAY);
    for (let other = 0; other < typeIdx; other++)
      network.addConnection(foodEvidenceIds[other], eid, -0.2, 1);
  }
  // Add reverse lateral inhibition connections
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      network.addConnection(foodEvidenceIds[j], foodEvidenceIds[i], -0.2, 1);
    }
  }

  // ── MODULE 2: VALUE / NUTRITION RE-LEARNING (~4 neurons) ─
  const valueNeuronIds = [];
  for (let typeIdx = 0; typeIdx < 4; typeIdx++) {
    const vid = network.addNeuron('value', 'R', { leak: 0.8 });
    valueNeuronIds.push(vid);
    network.addConnection(foodEvidenceIds[typeIdx], vid, 0.5, 0);
    network.addConnection(inputIds[SENSOR_MAP.reward], vid, 0.3, 1);
    network.addConnection(inputIds[SENSOR_MAP.hunger], vid, 0.2, 0);
  }

  // ── MODULE 3: PREDATOR LOCALISATION (~27 neurons) ────
  const predOmega = 2 * Math.PI * 47 / 1000;
  const predBankL = [], predBankR = [];
  for (let k = 0; k < 8; k++) {
    const nL = network.addNeuron('predator', 'O', {
      omega: predOmega + k * 0.001, decay: 0.97, coupling: 0.9
    });
    const nR = network.addNeuron('predator', 'O', {
      omega: predOmega + k * 0.001, decay: 0.97, coupling: 0.9
    });
    network.addConnection(inputIds[SENSOR_MAP.acousticL], nL, 0.8, k);
    network.addConnection(inputIds[SENSOR_MAP.acousticR], nR, 0.8, k);
    predBankL.push(nL);
    predBankR.push(nR);
  }
  // Comparison layer
  const predCompIds = [];
  for (let k = 0; k < 8; k++) {
    const cid = network.addNeuron('predator', 'R', { leak: 0.7 });
    predCompIds.push(cid);
    network.addConnection(predBankL[k], cid, 0.5, HP.PREDATOR_DELAY);
    network.addConnection(predBankR[k], cid, (k % 2 === 0 ? 0.5 : -0.5), HP.PREDATOR_DELAY);
  }
  // Danger output neurons
  const dangerCos = network.addNeuron('predator', 'R', { leak: 0.8 });
  const dangerSin = network.addNeuron('predator', 'R', { leak: 0.8 });
  const dangerLevel = network.addNeuron('predator', 'R', { leak: 0.75 });
  for (const cid of predCompIds) {
    network.addConnection(cid, dangerCos, 0.2, 0);
    network.addConnection(cid, dangerSin, 0.2, 0);
    network.addConnection(cid, dangerLevel, 0.15, 0);
  }

  // ── MODULE 4: DAY-NIGHT & SHELTER TIMING (~12 neurons) ─
  // Ring of 8 neurons — entrain from INDIRECT cues only (Fix 4)
  const ringIds = [];
  for (let k = 0; k < 8; k++) {
    const rid = network.addNeuron('shelter', 'R', { leak: 0.9 });
    ringIds.push(rid);
    // Energy drop at night → drives entrainment
    network.addConnection(inputIds[SENSOR_MAP.energy], rid, 0.15, 0);
    // Reward from nutritious eating during day → secondary cue
    network.addConnection(inputIds[SENSOR_MAP.reward], rid, 0.08, 0);
    // Proximity ray range shrinks at night → tertiary cue
    network.addConnection(inputIds[SENSOR_MAP.ray(0)], rid, 0.05, 0);
  }
  // Recurrent ring
  for (let k = 0; k < 8; k++)
    network.addConnection(ringIds[k], ringIds[(k + 1) % 8], 0.6, Math.round(800 / 8));
  // Policy neurons
  const shelterGoalCos = network.addNeuron('shelter', 'R', { leak: 0.85 });
  const shelterGoalSin = network.addNeuron('shelter', 'R', { leak: 0.85 });
  const shelterUrgency = network.addNeuron('shelter', 'R', { leak: 0.8 });
  const shelterGate = network.addNeuron('shelter', 'R', { leak: 0.7 });
  for (const rid of ringIds) {
    network.addConnection(rid, shelterGoalCos, 0.15, 0);
    network.addConnection(rid, shelterGoalSin, 0.15, 0);
    network.addConnection(rid, shelterUrgency, 0.12, 0);
  }
  network.addConnection(inputIds[SENSOR_MAP.shelterU1x], shelterGoalCos, 0.4, 0);
  network.addConnection(inputIds[SENSOR_MAP.shelterU1y], shelterGoalSin, 0.4, 0);
  network.addConnection(inputIds[SENSOR_MAP.energy], shelterGate, -0.3, 0);

  // ── MODULE 5: MOTOR CONTROL (~55 neurons) ────────────
  // Steering sub-network: 25 neurons
  const steeringIds = [];
  for (let k = 0; k < 25; k++)
    steeringIds.push(network.addNeuron('motor', 'R', { leak: 0.85 + Math.random() * 0.1 }));
  // Thrust sub-network: 25 neurons
  const thrustIds = [];
  for (let k = 0; k < 25; k++)
    thrustIds.push(network.addNeuron('motor', 'R', { leak: 0.85 + Math.random() * 0.1 }));
  // Eat gating: 2 neurons
  const eatGate1 = network.addNeuron('motor', 'R', { leak: 0.7 });
  const eatGate2 = network.addNeuron('motor', 'R', { leak: 0.7 });

  // Output neurons
  const thrustOut = network.addNeuron('motor', 'R', { leak: 0.6 });
  const turnRateOut = network.addNeuron('motor', 'R', { leak: 0.6 });
  const eatOut = network.addNeuron('motor', 'R', { leak: 0.5 });
  network.outputIds = { thrust: thrustOut, turnRate: turnRateOut, eat: eatOut };

  // Wire proprioception to sub-networks
  const propSensors = [SENSOR_MAP.speed, SENSOR_MAP.theta, SENSOR_MAP.vx, SENSOR_MAP.vy];
  for (const pid of propSensors) {
    for (const sid of steeringIds.slice(0, 8))
      network.addConnection(inputIds[pid], sid, (Math.random() - 0.5) * 0.2, 0);
    for (const tid of thrustIds.slice(0, 8))
      network.addConnection(inputIds[pid], tid, (Math.random() - 0.5) * 0.2, 0);
  }

  // Wire danger to steering (predator avoidance)
  network.addConnection(dangerCos, steeringIds[0], -0.5, HP.MOTOR_DELAY);
  network.addConnection(dangerSin, steeringIds[1], -0.5, HP.MOTOR_DELAY);
  network.addConnection(dangerLevel, thrustIds[0], 0.4, HP.MOTOR_DELAY);

  // Wire shelter goal to steering
  network.addConnection(shelterGoalCos, steeringIds[2], 0.4, 0);
  network.addConnection(shelterGoalSin, steeringIds[3], 0.4, 0);
  network.addConnection(shelterUrgency, thrustIds[1], 0.3, 0);

  // Wire food value to eat gating
  for (let typeIdx = 0; typeIdx < 4; typeIdx++) {
    network.addConnection(valueNeuronIds[typeIdx], eatGate1, 0.3, 0);
    network.addConnection(foodEvidenceIds[typeIdx], eatGate2, 0.25, 0);
  }

  // Wire proximity rays to steering and thrust
  for (let i = 0; i < 8; i++) {
    network.addConnection(inputIds[SENSOR_MAP.ray(i)], steeringIds[4 + i], (Math.random() - 0.5) * 0.3, 0);
    network.addConnection(inputIds[SENSOR_MAP.rayType(i)], thrustIds[2 + i], (Math.random() - 0.5) * 0.2, 0);
  }

  // Internal recurrent connections
  for (let k = 0; k < 5; k++) {
    network.addConnection(steeringIds[k], steeringIds[(k + 1) % 25], 0.1, 1);
    network.addConnection(thrustIds[k], thrustIds[(k + 1) % 25], 0.1, 1);
  }

  // Output connections
  for (const sid of steeringIds.slice(0, 10))
    network.addConnection(sid, turnRateOut, (Math.random() - 0.5) * 0.2, HP.MOTOR_DELAY);
  for (const tid of thrustIds.slice(0, 10))
    network.addConnection(tid, thrustOut, (Math.random() - 0.5) * 0.2, HP.MOTOR_DELAY);
  network.addConnection(eatGate1, eatOut, 0.5, 0);
  network.addConnection(eatGate2, eatOut, 0.4, 0);
  network.addConnection(inputIds[SENSOR_MAP.hunger], eatOut, 0.3, 0);

  console.log(`Brain built: ${network.neurons.length} neurons, ${network.connections.length} connections`);
}
