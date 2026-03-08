import { useEffect } from 'react';
import { useSimStore } from '@/lib/simContext';
import simAPI from '@/lib/mockSimAPI';
import TopHeaderBar from '@/components/TopHeaderBar';
import WorldCanvas from '@/components/WorldCanvas';
import BrainCanvas from '@/components/BrainCanvas';
import BottomHUD from '@/components/BottomHUD';
import LeftControlPanel from '@/components/LeftControlPanel';
import CentreMetrics from '@/components/CentreMetrics';
import RightBrainInspector from '@/components/RightBrainInspector';
import SignalFlowModal from '@/components/SignalFlowModal';
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

  useEffect(() => {
    const loadTimer = setTimeout(() => setSimReady(true), 1500);

    const statsInterval = setInterval(() => {
      const s = simAPI.getStats();
      const prev = useSimStore.getState().prevPredatorHits;
      if (s.predatorHits > prev) triggerEnergyFlash();
      setStats(s);
      useSimStore.setState({ prevPredatorHits: s.predatorHits });
    }, 100);

    const snapshotInterval = setInterval(() => {
      setSnapshot(simAPI.getSnapshot());
    }, 500);

    return () => {
      clearTimeout(loadTimer);
      clearInterval(statsInterval);
      clearInterval(snapshotInterval);
    };
  }, [setStats, setSnapshot, setSimReady, triggerEnergyFlash]);

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
        <WorldCanvas />
        <BrainCanvas />
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

      {showSignalFlowModal && <SignalFlowModal />}
      {!simReady && <LoadingScreen />}
      <KeyboardShortcuts />
    </div>
  );
};

export default Index;
