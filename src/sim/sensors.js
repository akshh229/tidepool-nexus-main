import { torusDist, torusVec2, vec2Len, vec2Norm, gaussNoise } from '../utils/math.js';
import { WORLD, daylight } from './world.js';

/**
 * Cast a ray from pos at angle, return [distance, objectType].
 * objectType: 0=nothing, 1=food, 2=predator, 3=wall(unused in torus), 4=shelter
 */
function castRay(pos, angle, effectiveRange, world) {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let nearest = effectiveRange;
  let nearestType = 0;

  // Check food sources
  for (const type of WORLD.FOOD_TYPES) {
    for (const src of world.foods.sources[type]) {
      if (src.respawnTimer > 0) continue;
      const hit = rayPointCheck(pos, dirX, dirY, src, effectiveRange);
      if (hit !== null && hit < nearest) {
        nearest = hit;
        nearestType = 1;
      }
    }
  }

  // Check predators
  for (const a of world.predators.agents) {
    const hit = rayPointCheck(pos, dirX, dirY, a, effectiveRange);
    if (hit !== null && hit < nearest) {
      nearest = hit;
      nearestType = 2;
    }
  }

  // Check shelters
  for (const s of world.shelters) {
    const hit = rayPointCheck(pos, dirX, dirY, s, effectiveRange);
    if (hit !== null && hit < nearest) {
      nearest = hit;
      nearestType = 4;
    }
  }

  return [nearest, nearestType];
}

/**
 * Check if a ray from pos in direction (dirX, dirY) comes within ~1 unit of target.
 * Uses toroidal shortest path. Returns distance to closest approach or null.
 */
function rayPointCheck(pos, dirX, dirY, target, maxRange) {
  const v = torusVec2(pos, target, WORLD.SIZE);
  // Project onto ray direction
  const dot = v.x * dirX + v.y * dirY;
  if (dot < 0 || dot > maxRange) return null;
  // Perpendicular distance
  const perpX = v.x - dot * dirX;
  const perpY = v.y - dot * dirY;
  const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
  if (perpDist < WORLD.RAY_HIT_RADIUS) return dot;
  return null;
}

export function buildSensorVector(world) {
  const c = world.creature;
  const t = world.currentStep;
  const dl = daylight(t);
  const sensors = new Float32Array(30);

  // [0] chemical
  sensors[0] = world.foods.computeChemicalSignal(c.x, c.y);

  // [1] acousticL, [2] acousticR
  const [aL, aR] = world.predators.computeAcousticSignals(c, t);
  sensors[1] = aL;
  sensors[2] = aR;

  // [3..18] proximity rays (8 rays × 2 values: distance, objType)
  const effectiveRange = Math.max(WORLD.RAY_RANGE * dl, 0.1);
  for (let i = 0; i < 8; i++) {
    const angle = c.theta + i * (2 * Math.PI / 8);
    const [dist, objType] = castRay({ x: c.x, y: c.y }, angle, effectiveRange, world);
    sensors[3 + i * 2] = dist + gaussNoise(WORLD.PROXIMITY_NOISE_SIGMA);
    sensors[4 + i * 2] = objType;
  }

  // [19..22] shelter beacons (unit vectors to each shelter)
  for (let i = 0; i < 2; i++) {
    const v = torusVec2({ x: c.x, y: c.y }, world.shelters[i], WORLD.SIZE);
    const n = vec2Norm(v);
    sensors[19 + i * 2] = n.x;
    sensors[20 + i * 2] = n.y;
  }

  // [23..26] proprioception
  sensors[23] = vec2Len({ x: c.vx, y: c.vy }); // speed
  sensors[24] = c.theta;
  sensors[25] = c.vx;
  sensors[26] = c.vy;

  // [27..29] internal state
  sensors[27] = c.energy / WORLD.MAX_ENERGY;
  sensors[28] = c.hunger;
  sensors[29] = c.rewardTimer > 0 ? c.lastReward : 0;

  // Add noise to continuous sensors (skip objType slots at indices 4,6,8,10,12,14,16,18)
  const continuousIndices = [0, 1, 2, 23, 24, 25, 26, 27, 28, 29];
  for (const i of continuousIndices) {
    sensors[i] += gaussNoise(WORLD.SENSOR_NOISE_SIGMA);
  }

  return sensors;
}
