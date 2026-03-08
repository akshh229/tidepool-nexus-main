// Module 2: Value / Nutrition Memory
// 4 Type R value neurons — one per food type
// Fed by food evidence, reward signal, and hunger
// Learns which food types are currently nutritious via reward-modulated Hebbian learning
export const VALUE_MEMORY = {
  name: 'Value Memory',
  module: 'value',
  description: 'Tracks nutritional value of each food type, adapts on nutrition rotation',
  neuronTypes: ['R (value integrator)'],
  inputSignals: ['food evidence', 'reward', 'hunger'],
  outputSignals: ['value estimate per type (A/B/C/D)']
};
