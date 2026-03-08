import { RingBuffer } from '../utils/ringBuffer.js';
import { torusWrap, torusDist, gaussNoise } from '../utils/math.js';
import { WORLD } from './world.js';

export class PredatorManager {
  constructor() {
    this.agents = [];
  }

  reset(params) {
    this.agents = params.map((p, i) => ({
      id: i,
      cx: p.cx, cy: p.cy,
      Ax: p.Ax, Ay: p.Ay,
      wx: p.wx, wy: p.wy,
      phx: p.phx, phy: p.phy,
      x: p.cx, y: p.cy,
      acousticBuffer: new RingBuffer(30)
    }));
  }

  tick(t) {
    for (const a of this.agents) {
      a.x = torusWrap(a.cx + a.Ax * Math.sin(a.wx * t + a.phx), WORLD.SIZE);
      a.y = torusWrap(a.cy + a.Ay * Math.sin(a.wy * t + a.phy), WORLD.SIZE);
      const emission = Math.sin(2 * Math.PI * WORLD.PREDATOR_FREQ * t / 1000);
      a.acousticBuffer.push(emission);
    }
  }

  computeAcousticSignals(creature, t) {
    // Ear positions in world frame
    const earL = {
      x: creature.x + (-WORLD.EAR_OFFSET) * Math.cos(creature.theta + Math.PI / 2),
      y: creature.y + (-WORLD.EAR_OFFSET) * Math.sin(creature.theta + Math.PI / 2)
    };
    const earR = {
      x: creature.x + WORLD.EAR_OFFSET * Math.cos(creature.theta + Math.PI / 2),
      y: creature.y + WORLD.EAR_OFFSET * Math.sin(creature.theta + Math.PI / 2)
    };

    let signalL = 0, signalR = 0;
    for (const a of this.agents) {
      // Left ear
      const dxL = torusDist(earL.x, a.x, WORLD.SIZE);
      const dyL = torusDist(earL.y, a.y, WORLD.SIZE);
      const dL = Math.sqrt(dxL * dxL + dyL * dyL);
      const delayL = Math.round(dL / WORLD.V_SOUND);
      signalL += a.acousticBuffer.get(delayL) / Math.max(dL, 1);

      // Right ear
      const dxR = torusDist(earR.x, a.x, WORLD.SIZE);
      const dyR = torusDist(earR.y, a.y, WORLD.SIZE);
      const dR = Math.sqrt(dxR * dxR + dyR * dyR);
      const delayR = Math.round(dR / WORLD.V_SOUND);
      signalR += a.acousticBuffer.get(delayR) / Math.max(dR, 1);
    }

    signalL += gaussNoise(WORLD.SENSOR_NOISE_SIGMA);
    signalR += gaussNoise(WORLD.SENSOR_NOISE_SIGMA);
    return [signalL, signalR];
  }

  checkHit(cx, cy, radius) {
    for (const a of this.agents) {
      const dx = torusDist(cx, a.x, WORLD.SIZE);
      const dy = torusDist(cy, a.y, WORLD.SIZE);
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        return {
          agent: a,
          teleport: () => {
            a.cx = Math.random() * WORLD.SIZE;
            a.cy = Math.random() * WORLD.SIZE;
          }
        };
      }
    }
    return null;
  }

  getSnapshot() {
    return this.agents.map(a => ({ x: a.x, y: a.y, id: a.id }));
  }
}
