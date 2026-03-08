/**
 * Headless 30-trial simulation runner.
 * Run with: node runTrials.js
 * Outputs results to: TRIAL_RESULTS.md
 */
import { World, WORLD } from './src/sim/world.js';
import { Network, buildDefaultBrain } from './src/sim/brain/network.js';
import { TrialManager } from './src/sim/trial.js';
import { Scorer } from './src/sim/scorer.js';
import { on } from './src/utils/eventBus.js';
import { writeFileSync } from 'node:fs';

const NUM_TRIALS = 30;
const STEPS_PER_TRIAL = WORLD.TRIAL_LENGTH; // 20000

const world = new World();
const network = new Network();
const trialManager = new TrialManager(NUM_TRIALS);
const scorer = new Scorer();
buildDefaultBrain(network);

const perTrialResults = [];

console.log(`Running ${NUM_TRIALS} trials (${STEPS_PER_TRIAL} steps each)...\n`);

for (let t = 0; t < NUM_TRIALS; t++) {
  trialManager.startNextTrial(world, network);
  scorer.reset();

  for (let step = 0; step < STEPS_PER_TRIAL; step++) {
    const sensorVec = world.getSensorVector();
    const actions = network.step(sensorVec);
    world.tick(actions[0], actions[1], actions[2]);
    scorer.update(world.getScorerState(), network);
  }

  const metrics = scorer.getTrialMetrics();
  trialManager.recordTrialResult(metrics);
  perTrialResults.push({ trial: t + 1, ...metrics });

  const pct = ((t + 1) / NUM_TRIALS * 100).toFixed(0);
  process.stdout.write(`\r  Trial ${String(t + 1).padStart(2)}/${NUM_TRIALS}  [${pct}%]  survival=${(metrics.survivalFraction * 100).toFixed(1)}%  foraging=${(metrics.foragingAccuracy * 100).toFixed(1)}%`);
}

console.log('\n');

const agg = trialManager.getAggregateScores();

// ── Build results file ──────────────────────────────────────────────
const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
const divider = '─'.repeat(60);

function pct(v) { return (v * 100).toFixed(2) + '%'; }
function f4(v) { return v.toFixed(4); }

let md = `# Tidepool Brain — 30-Trial Simulation Results\n\n`;
md += `**Date:** ${now}\n`;
md += `**Trials:** ${NUM_TRIALS}  |  **Steps per trial:** ${STEPS_PER_TRIAL.toLocaleString()}\n`;
md += `**Neurons:** ${network.neuronCount}  |  **Connections:** ${network.connections.length}\n\n`;

md += `## Aggregate Scores (mean across ${NUM_TRIALS} trials)\n\n`;
md += `| Metric | Score |\n`;
md += `|--------|-------|\n`;
md += `| Survival Rate | ${pct(agg.survivalFraction)} |\n`;
md += `| Foraging Accuracy | ${pct(agg.foragingAccuracy)} |\n`;
md += `| Adaptation Score | ${f4(agg.adaptationScore)} |\n`;
md += `| Predator Avoidance | ${pct(agg.predatorAvoidance)} |\n`;
md += `| Shelter Timing | ${pct(agg.shelterTiming)} |\n`;
md += `| Navigation Efficiency | ${pct(agg.navigationEfficiency)} |\n`;
md += `| Activity Efficiency | ${f4(agg.activityEfficiency)} |\n`;
md += `| Avg Activity Cost | ${f4(agg.activityCostAvg)} |\n\n`;

const weights = {
  survivalFraction: 10,
  foragingAccuracy: 10,
  adaptationScore: 5,
  predatorAvoidance: 10,
  shelterTiming: 5,
  navigationEfficiency: 5,
  activityEfficiency: 5
};
let totalScore = 0;
md += `## Weighted Score Breakdown (out of 50)\n\n`;
md += `| Category | Weight | Raw | Pts |\n`;
md += `|----------|--------|-----|-----|\n`;
for (const [key, max] of Object.entries(weights)) {
  const raw = Math.min(agg[key], 1);
  const pts = raw * max;
  totalScore += pts;
  md += `| ${key} | ${max} | ${f4(raw)} | ${pts.toFixed(2)} |\n`;
}
md += `| **TOTAL** | **50** | | **${totalScore.toFixed(2)}** |\n\n`;

md += `## Per-Trial Breakdown\n\n`;
md += `| Trial | Survival | Foraging | Predator Avoid | Shelter | Activity Eff | Correct Eats | Toxic Eats | Predator Hits |\n`;
md += `|-------|----------|----------|----------------|---------|-------------|-------------|-----------|---------------|\n`;
for (const r of perTrialResults) {
  md += `| ${String(r.trial).padStart(2)} `;
  md += `| ${pct(r.survivalFraction)} `;
  md += `| ${pct(r.foragingAccuracy)} `;
  md += `| ${pct(r.predatorAvoidance)} `;
  md += `| ${pct(r.shelterTiming)} `;
  md += `| ${f4(r.activityEfficiency)} `;
  md += `| ${r.correctEats} `;
  md += `| ${r.toxicEats} `;
  md += `| ${r.predatorHits} |\n`;
}

md += `\n## Key Definitions\n\n`;
md += `- **Survival Rate**: Fraction of steps the creature remained alive (energy > 0)\n`;
md += `- **Foraging Accuracy**: (correct eats − toxic eats) / total eats\n`;
md += `- **Predator Avoidance**: 1 − (hits / expected random baseline hits)\n`;
md += `- **Shelter Timing**: Fraction of night steps spent inside shelter\n`;
md += `- **Activity Efficiency**: Functional performance / (avg activity cost × neuron count) — measures sparse coding\n`;
md += `- **Adaptation Score**: 1 / ln(mean steps to re-learn after nutrition rotation + e)\n`;

const outPath = 'TRIAL_RESULTS.md';
writeFileSync(outPath, md, 'utf-8');
console.log(`Results written to ${outPath}`);
console.log(`\n  TOTAL SCORE: ${totalScore.toFixed(2)} / 50\n`);
