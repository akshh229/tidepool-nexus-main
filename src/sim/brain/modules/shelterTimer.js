// Module 4: Day-Night & Shelter Timing
// 8 Type R neurons in recurrent ring (entraining to ~800-step day/night cycle)
// 4 policy neurons: shelterGoalCos, shelterGoalSin, shelterUrgency, shelterGate
// Entrains from INDIRECT cues only: energy changes, reward, proximity ray range
export const SHELTER_TIMER = {
  name: 'Shelter Timer',
  module: 'shelter',
  description: 'Entrains to day/night cycle from indirect cues, drives shelter-seeking at night',
  neuronTypes: ['R (ring oscillator)', 'R (policy)'],
  inputSensors: ['energy (indirect daylight)', 'reward', 'ray(0) (range shrinks at night)', 'shelter beacons'],
  outputSignals: ['shelterGoalCos', 'shelterGoalSin', 'shelterUrgency', 'shelterGate']
};
