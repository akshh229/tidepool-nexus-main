import { clamp } from '../../utils/math.js';

export const HP = {
  LEARNING_RATE:      0.001,
  ALPHA:              1.0,
  BETA:               0.5,
  MAX_WEIGHT:         3.0,
  HOMEOSTATIC_DECAY:  0.0001,
  M1_EMA_ALPHA:       0.05,
  M2_EMA_ALPHA:       0.2,
  DEFAULT_LEAK:       0.9,
  DEFAULT_BIAS:       0.0,
  DEFAULT_DECAY:      0.97,
  DEFAULT_COUPLING:   0.8,
  INIT_WEIGHT_RANGE:  0.1,
  CHEMO_DELAY:        3,
  PREDATOR_DELAY:     2,
  MOTOR_DELAY:        0,
  ACTIVITY_NORM:      1.0 / 500
};

export function applyLearningRule(connection, preOutput, postOutput, M1, M2) {
  const hebbian = preOutput * postOutput;
  const delta = HP.LEARNING_RATE * hebbian * (HP.ALPHA * M1 + HP.BETA * M2);
  if (!isFinite(delta)) return;
  connection.weight = clamp(
    connection.weight + delta,
    -HP.MAX_WEIGHT, HP.MAX_WEIGHT
  );
  connection.weight *= (1 - HP.HOMEOSTATIC_DECAY);
}
