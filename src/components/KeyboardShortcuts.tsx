import { useEffect } from 'react';
import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';

const KeyboardShortcuts = () => {
  const isRunning = useSimStore((s) => s.isRunning);
  const brainFullscreen = useSimStore((s) => s.brainFullscreen);
  const setRunning = useSimStore((s) => s.setRunning);
  const toggleSensorOverlay = useSimStore((s) => s.toggleSensorOverlay);
  const toggleCurrentsOverlay = useSimStore((s) => s.toggleCurrentsOverlay);
  const setBrainFullscreen = useSimStore((s) => s.setBrainFullscreen);
  const setShowSignalFlowModal = useSimStore((s) => s.setShowSignalFlowModal);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          simAPI.pause();
          setRunning(false);
        } else {
          simAPI.start();
          setRunning(true);
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        simAPI.reset();
        setRunning(false);
      }
      if (e.key === 's' || e.key === 'S') toggleSensorOverlay();
      if (e.key === 'c' || e.key === 'C') toggleCurrentsOverlay();
      if (e.key === 'b' || e.key === 'B') setBrainFullscreen(!brainFullscreen);
      if (e.key === 'Escape') {
        setShowSignalFlowModal(false);
        setBrainFullscreen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isRunning, brainFullscreen, setRunning, toggleSensorOverlay, toggleCurrentsOverlay, setBrainFullscreen, setShowSignalFlowModal]);

  return null;
};

export default KeyboardShortcuts;
