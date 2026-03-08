// Module 1: Chemo Decoder
// 4 banks × 8 Type O oscillatory neurons (tuned to food pulse periods: 6, 10, 16, 24)
// 4 Type R evidence neurons with lateral inhibition
// Total: ~36 neurons
export const CHEMO_DECODER = {
  name: 'Chemo Decoder',
  module: 'chemo',
  description: 'Decodes food chemical pulse frequencies to identify food type',
  neuronTypes: ['O (band-pass)', 'R (evidence accumulator)'],
  inputSensors: ['chemical'],
  outputSignals: ['food evidence per type (A/B/C/D)']
};
