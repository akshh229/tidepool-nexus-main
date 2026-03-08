export interface NeuronDetail {
  id: number;
  module: 'chemo' | 'predator' | 'shelter' | 'value' | 'motor' | 'input';
  type: 'R' | 'O' | 'input';
  output: number;
  activityHistory: number[];
  inDegree: number;
  outDegree: number;
}

export interface SimStats {
  energy: number;
  hunger: number;
  reward: number;
  correctEats: number;
  toxicEats: number;
  predatorHits: number;
  nightInShelter: number;
  currentStep: number;
  currentTrial: number;
  nutritionPhase: string;
  daylight: number;
  speed: number;
  position: { x: number; y: number };
  heading: number;
  activityCost: number;
  learningEnabled: boolean;
  stepsToNightfall: number;
  stepsToNutritionRotation: number;
  eventLog: string[];
  energyHistory: number[];
  correctEatHistory: number[];
  activityCostHistory: number[];
  predatorHitSteps: number[];
  chemicalHistory: number[];
  acousticLHistory: number[];
  acousticRHistory: number[];
  neuronCount: number;
  connectionCount: number;
  avgWeightMagnitude: number;
  M1: number;
  M2: number;
  trialResults: TrialResult[];
  aggregateScores: AggregateScores | null;
}

export interface AggregateScores {
  survivalFraction: number;
  foragingAccuracy: number;
  adaptationScore: number;
  predatorAvoidance: number;
  shelterTiming: number;
  navigationEfficiency: number;
  activityEfficiency: number;
}

export interface SimSnapshot {
  neurons: NeuronDetail[];
  connections: { fromId: number; toId: number; weight: number }[];
  activityThisStep: number;
  neuronCount: number;
  moduleNeuronCounts: {
    chemo: number;
    predator: number;
    shelter: number;
    value: number;
    motor: number;
  };
  M1: number;
  M2: number;
}

export interface TrialResult {
  trial: number;
  survivalFraction: number;
  foragingAccuracy: number;
  adaptationScore: number;
  predatorAvoidance: number;
  shelterTiming: number;
  navigationEfficiency: number;
  activityEfficiency: number;
}
