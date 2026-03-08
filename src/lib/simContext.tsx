import { create } from 'zustand';
import { simAPI } from '../simAPI.js';
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
}

export const useSimStore = create<SimStore>((set) => ({
  stats: simAPI.getStats(),
  snapshot: simAPI.getSnapshot(),
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
