import { create } from 'zustand';
import type { SimStats, SimSnapshot, NeuronDetail } from './types';

interface SimStore {
  stats: SimStats;
  snapshot: SimSnapshot;
  isRunning: boolean;
  simReady: boolean;
  timeScale: number;
  scenario: 'baseline' | 'heatwave' | 'polluted';
  sensorOverlay: boolean;
  currentsOverlay: boolean;
  pathsOverlay: boolean;
  raysOverlay: boolean;
  hoveredNeuron: NeuronDetail | null;
  pinnedNeuron: NeuronDetail | null;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showSignalFlowModal: boolean;
  showScoreBreakdown: boolean;
  brainFullscreen: boolean;
  ablations: {
    disableLearning: boolean;
    noPredatorModule: boolean;
    noShelterTiming: boolean;
  };
  prevPredatorHits: number;
  energyFlashing: boolean;

  setStats: (s: SimStats) => void;
  setSnapshot: (s: SimSnapshot) => void;
  setRunning: (v: boolean) => void;
  setSimReady: (v: boolean) => void;
  setTimeScale: (v: number) => void;
  setScenario: (v: 'baseline' | 'heatwave' | 'polluted') => void;
  toggleSensorOverlay: () => void;
  toggleCurrentsOverlay: () => void;
  togglePathsOverlay: () => void;
  toggleRaysOverlay: () => void;
  setHoveredNeuron: (n: NeuronDetail | null) => void;
  setPinnedNeuron: (n: NeuronDetail | null) => void;
  setLeftPanelOpen: (v: boolean) => void;
  setRightPanelOpen: (v: boolean) => void;
  setShowSignalFlowModal: (v: boolean) => void;
  setShowScoreBreakdown: (v: boolean) => void;
  toggleAblation: (key: keyof SimStore['ablations']) => void;
  triggerEnergyFlash: () => void;
  setBrainFullscreen: (v: boolean) => void;
  showAICoachModal: boolean;
  setShowAICoachModal: (v: boolean) => void;
  showAIBuilderModal: boolean;
  setShowAIBuilderModal: (v: boolean) => void;
  showAblationModal: boolean;
  setShowAblationModal: (v: boolean) => void;
}

const defaultStats: SimStats = {
  energy: 0, hunger: 0, reward: 0,
  correctEats: 0, toxicEats: 0, predatorHits: 0, nightInShelter: 0,
  currentStep: 0, currentTrial: 0,
  nutritionPhase: '', daylight: 1, speed: 0,
  position: { x: 0, y: 0 }, heading: 0,
  activityCost: 0, learningEnabled: true,
  stepsToNightfall: 0, stepsToNutritionRotation: 0,
  eventLog: [],
  energyHistory: [], correctEatHistory: [], activityCostHistory: [],
  predatorHitSteps: [],
  chemicalHistory: [], acousticLHistory: [], acousticRHistory: [],
  neuronCount: 0, connectionCount: 0, avgWeightMagnitude: 0,
  M1: 0, M2: 0,
  trialResults: [], aggregateScores: null
} as SimStats;

const defaultSnapshot: SimSnapshot = {
  neurons: [], connections: [], activityThisStep: 0,
  neuronCount: 0, moduleNeuronCounts: {}, M1: 0, M2: 0
} as SimSnapshot;

export const useSimStore = create<SimStore>((set) => ({
  stats: defaultStats,
  snapshot: defaultSnapshot,
  isRunning: false,
  simReady: false,
  timeScale: 1,
  scenario: 'baseline',
  sensorOverlay: false,
  currentsOverlay: false,
  pathsOverlay: false,
  raysOverlay: false,
  hoveredNeuron: null,
  pinnedNeuron: null,
  leftPanelOpen: true,
  rightPanelOpen: true,
  showSignalFlowModal: false,
  showScoreBreakdown: false,
  showAICoachModal: false,
  showAIBuilderModal: false,
  showAblationModal: false,
  brainFullscreen: false,
  ablations: { disableLearning: false, noPredatorModule: false, noShelterTiming: false },
  prevPredatorHits: 0,
  energyFlashing: false,

  setStats: (s) => set({ stats: s }),
  setSnapshot: (s) => set({ snapshot: s }),
  setRunning: (v) => set({ isRunning: v }),
  setSimReady: (v) => set({ simReady: v }),
  setTimeScale: (v) => set({ timeScale: v }),
  setScenario: (v) => set({ scenario: v }),
  toggleSensorOverlay: () => set((s) => ({ sensorOverlay: !s.sensorOverlay })),
  toggleCurrentsOverlay: () => set((s) => ({ currentsOverlay: !s.currentsOverlay })),
  togglePathsOverlay: () => set((s) => ({ pathsOverlay: !s.pathsOverlay })),
  toggleRaysOverlay: () => set((s) => ({ raysOverlay: !s.raysOverlay })),
  setHoveredNeuron: (n) => set({ hoveredNeuron: n }),
  setPinnedNeuron: (n) => set({ pinnedNeuron: n }),
  setLeftPanelOpen: (v) => set({ leftPanelOpen: v }),
  setRightPanelOpen: (v) => set({ rightPanelOpen: v }),
  setShowSignalFlowModal: (v) => set({ showSignalFlowModal: v }),
  setShowScoreBreakdown: (v) => set({ showScoreBreakdown: v }),
  setShowAICoachModal: (v) => set({ showAICoachModal: v }),
  setShowAIBuilderModal: (v) => set({ showAIBuilderModal: v }),
  setShowAblationModal: (v) => set({ showAblationModal: v }),
  toggleAblation: (key) =>
    set((s) => ({
      ablations: { ...s.ablations, [key]: !s.ablations[key] },
    })),
  triggerEnergyFlash: () => {
    set({ energyFlashing: true });
    setTimeout(() => set({ energyFlashing: false }), 300);
  },
  setBrainFullscreen: (v) => set({ brainFullscreen: v }),
}));
