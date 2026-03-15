import { useEffect, useState } from 'react';
import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';
import TopHeaderBar from '@/components/TopHeaderBar';
import WorldCanvas from '@/components/WorldCanvas';
import BrainCanvas from '@/components/BrainCanvas';
import BottomHUD from '@/components/BottomHUD';
import LeftControlPanel from '@/components/LeftControlPanel';
import CentreMetrics from '@/components/CentreMetrics';
import RightBrainInspector from '@/components/RightBrainInspector';
import SignalFlowModal from '@/components/SignalFlowModal';
import AICoachModal from '@/components/AICoachModal';
import AIBuilderModal from '@/components/AIBuilderModal';
import LoadingScreen from '@/components/LoadingScreen';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import { COLORS } from '@/lib/constants';

const Index = () => {
  const setStats = useSimStore((s) => s.setStats);
  const setSnapshot = useSimStore((s) => s.setSnapshot);
  const setSimReady = useSimStore((s) => s.setSimReady);
  const triggerEnergyFlash = useSimStore((s) => s.triggerEnergyFlash);
  const showSignalFlowModal = useSimStore((s) => s.showSignalFlowModal);
  const simReady = useSimStore((s) => s.simReady);
  const leftPanelOpen = useSimStore((s) => s.leftPanelOpen);
  const rightPanelOpen = useSimStore((s) => s.rightPanelOpen);
  const [maxView, setMaxView] = useState<'world' | 'brain' | null>(null);

  useEffect(() => {
    const loadTimer = setTimeout(() => setSimReady(true), 1500);

    const statsInterval = setInterval(() => {
      if (document.hidden) return;
      const s = simAPI.getStats();
      const prev = useSimStore.getState().prevPredatorHits;
      if (s.predatorHits > prev) triggerEnergyFlash();
      setStats(s);
      useSimStore.setState({ prevPredatorHits: s.predatorHits });
    }, 100);

    const snapshotInterval = setInterval(() => {
      if (document.hidden) return;
      setSnapshot(simAPI.getSnapshot());
    }, 500);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(statsInterval);
      clearInterval(snapshotInterval);
    };
  }, [setStats, setSnapshot, setSimReady, triggerEnergyFlash]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaxView(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const leftCol = leftPanelOpen ? '220px' : '32px';
  const rightCol = rightPanelOpen ? '240px' : '32px';

  return (
    <div
      className="w-screen h-screen overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateRows: '52px 1fr 56px auto',
        gridTemplateColumns: '1fr',
        backgroundColor: COLORS.cream,
      }}
    >
      <TopHeaderBar />

      <div className="flex w-full h-full overflow-hidden min-h-0">
        <WorldCanvas isMaxView={maxView === 'world'} onMaxView={() => setMaxView(maxView === 'world' ? null : 'world')} />
        <BrainCanvas isMaxView={maxView === 'brain'} onMaxView={() => setMaxView(maxView === 'brain' ? null : 'brain')} />
      </div>

      <BottomHUD />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${leftCol} 1fr ${rightCol}`,
          minHeight: 280,
          transition: 'grid-template-columns 150ms ease',
        }}
      >
        <LeftControlPanel />
        <CentreMetrics />
        <RightBrainInspector />
      </div>

      {maxView && (
        <div
          className="fixed inset-0 z-[9998] bg-black/70"
          onClick={() => setMaxView(null)}
        />
      )}
      {showSignalFlowModal && <SignalFlowModal />}
      <AICoachModal />
      <AIBuilderModal />
      {!simReady && <LoadingScreen />}
      <KeyboardShortcuts />
    </div>
  );
};

export default Index;
