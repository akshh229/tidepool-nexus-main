// Module 5: Motor Control
// 25 Type R steering neurons → turnRate output
// 25 Type R thrust neurons → thrust output
// 2 Type R eat gate neurons → eat output
// 3 output neurons (thrust, turnRate, eat)
export const MOTOR_CONTROL = {
  name: 'Motor Control',
  module: 'motor',
  description: 'Integrates all module outputs into motor commands (thrust, turn, eat)',
  neuronTypes: ['R (steering)', 'R (thrust)', 'R (eat gate)', 'R (output)'],
  inputSignals: ['proprioception', 'danger', 'shelter goal', 'food value', 'proximity rays'],
  outputSignals: ['thrust [-1,1]', 'turnRate [-π/6, π/6]', 'eat [0,1]']
};
