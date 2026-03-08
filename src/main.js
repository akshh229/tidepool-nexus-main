import { simAPI } from './simAPI.js';
import { World } from './sim/world.js';
import { Network, buildDefaultBrain } from './sim/brain/network.js';
import { TrialManager } from './sim/trial.js';
import { Scorer } from './sim/scorer.js';

async function main() {
  // Instantiate all subsystems
  const world = new World();
  const network = new Network();
  const trialManager = new TrialManager(30);
  const scorer = new Scorer();
  buildDefaultBrain(network);

  // Wire into singleton API
  simAPI._init({ world, network, trialManager, scorer });

  // Expose to React UI and devtools
  window.simAPI = simAPI;

  // Mount canvases if running standalone (not inside Lovable)
  const worldCanvas = document.getElementById('world-canvas');
  const brainCanvas = document.getElementById('brain-canvas');

  if (worldCanvas) await simAPI.mountWorldCanvas(worldCanvas);
  if (brainCanvas) await simAPI.mountBrainCanvas(brainCanvas);

  // Auto-start
  simAPI.start();
}

main().catch(console.error);
