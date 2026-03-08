// Module 3: Predator Localisation
// 2 banks × 8 Type O oscillatory neurons (tuned to predator freq 47Hz, one per ear)
// 8 Type R comparison neurons (L+R and L-R for direction estimation)
// 3 danger output neurons (cos, sin, level)
export const PREDATOR_LOCATOR = {
  name: 'Predator Locator',
  module: 'predator',
  description: 'Localises predators via interaural time/level difference in acoustic signals',
  neuronTypes: ['O (acoustic filter)', 'R (comparator)', 'R (danger output)'],
  inputSensors: ['acousticL', 'acousticR'],
  outputSignals: ['dangerCos', 'dangerSin', 'dangerLevel']
};
