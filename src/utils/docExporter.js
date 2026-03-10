import { HP } from '../sim/brain/learningRule.js';

export function exportSubmissionData(api) {
  const network = api.network;
  const trialManager = api.trialManager;

  const data = {
    meta: {
      project: 'The Tidepool Brain',
      team: 'Kamand Bioengineering Group',
      hackathon: 'HACKBIO 26',
      exportedAt: new Date().toISOString()
    },
    architecture: {
      neuronCount: network.neurons.filter(n => n.type !== 'input').length,
      inputCount: network.inputNeuronIds.length,
      connectionCount: network.connections.length,
      neuronTypes: {
        R: network.neurons.filter(n => n.type === 'R').length,
        O: network.neurons.filter(n => n.type === 'O').length,
        input: network.neurons.filter(n => n.type === 'input').length
      },
      modules: _getModuleSummary(network),
      wiringDiagram: network.getWiringDiagram(),
      learningRule: {
        type: 'Reward-modulated Hebbian with homeostatic decay',
        hyperparameters: _extractHP()
      }
    },
    trials: {
      totalTrials: trialManager.trialResults.length,
      results: trialManager.trialResults,
      aggregateScores: trialManager.isComplete() ? trialManager.getAggregateScores() : null
    },
    ablations: api._ablationResults,
    weightHistories: network.getWeightHistories()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `tidepool-brain-submission-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function _getModuleSummary(network) {
  const modules = {};
  for (const n of network.neurons) {
    if (!modules[n.module]) modules[n.module] = { count: 0, types: {} };
    modules[n.module].count++;
    modules[n.module].types[n.type] = (modules[n.module].types[n.type] || 0) + 1;
  }
  return modules;
}

function _extractHP() {
  return { ...HP };
}
