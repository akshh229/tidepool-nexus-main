import { useEffect, useRef } from 'react';
import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';
import { COLORS, FONTS } from '@/lib/constants';
import { LineChart, Line } from 'recharts';
import type { NeuronDetail } from '@/lib/types';

const MODULE_NAMES: Record<string, string> = {
  chemo: 'Chemosensory',
  predator: 'Predator',
  shelter: 'Shelter',
  value: 'Value',
  motor: 'Motor',
};

const BrainCanvas = ({ isMaxView, onMaxView }: { isMaxView: boolean; onMaxView: () => void }) => {
  const brainCanvasRef = useRef<HTMLCanvasElement>(null);
  const snapshot = useSimStore((s) => s.snapshot);
  const hoveredNeuron = useSimStore((s) => s.hoveredNeuron);
  const brainFullscreen = useSimStore((s) => s.brainFullscreen);
  const setHoveredNeuron = useSimStore((s) => s.setHoveredNeuron);
  const setPinnedNeuron = useSimStore((s) => s.setPinnedNeuron);

  useEffect(() => {
    if (!brainCanvasRef.current) return;
    simAPI.mountBrainCanvas(brainCanvasRef.current);

    const canvas = brainCanvasRef.current;
    const onHover = (e: Event) => setHoveredNeuron((e as CustomEvent<NeuronDetail>).detail);
    const onClick = (e: Event) => setPinnedNeuron((e as CustomEvent<NeuronDetail>).detail);
    const onLeave = () => setHoveredNeuron(null);
    canvas.addEventListener('neuronHover', onHover);
    canvas.addEventListener('neuronClick', onClick);
    canvas.addEventListener('neuronLeave', onLeave);

    const observer = new ResizeObserver(() => {
      canvas.dispatchEvent(
        new CustomEvent('containerResized', {
          detail: { width: canvas.clientWidth, height: canvas.clientHeight },
        })
      );
    });
    if (canvas.parentElement) observer.observe(canvas.parentElement);
    observer.observe(canvas);

    return () => {
      canvas.removeEventListener('neuronHover', onHover);
      canvas.removeEventListener('neuronClick', onClick);
      canvas.removeEventListener('neuronLeave', onLeave);
      observer.disconnect();
    };
  }, [setHoveredNeuron, setPinnedNeuron]);

  useEffect(() => {
    const canvas = brainCanvasRef.current;
    if (!canvas) return;
    const frame = requestAnimationFrame(() => {
      canvas.dispatchEvent(
        new CustomEvent('containerResized', {
          detail: { width: canvas.clientWidth, height: canvas.clientHeight },
        })
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [isMaxView]);

  const modules = Object.entries(snapshot.moduleNeuronCounts) as [string, number][];

  return (
    <div
      className={`relative overflow-hidden ${isMaxView ? 'fixed inset-0 z-50 w-screen h-screen' : 'flex-grow'}`}
      style={{
        backgroundColor: COLORS.deepest,
        ...(!isMaxView ? { borderTopRightRadius: 16 } : {}),
        ...(brainFullscreen && !isMaxView
          ? { position: 'fixed', inset: 0, zIndex: 40, borderRadius: 0 }
          : {}),
      }}
    >
      {/* Label */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 9,
            color: COLORS.amber,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Neural Brain — Live
        </span>
        <button
          onClick={onMaxView}
          title={isMaxView ? 'Exit Max View' : 'Max View'}
          className="text-xs text-amber-400 hover:text-white border border-amber-400/30 hover:border-amber-400 px-2 py-0.5 rounded transition-all"
          style={{ fontFamily: FONTS.mono, fontSize: 9 }}
        >
          {isMaxView ? '⊠ Exit' : '⛶ Max'}
        </button>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: COLORS.amber,
            animation: 'statusPulse 1.5s ease infinite',
          }}
        />
      </div>

      {/* Module chips */}
      <div className="absolute top-7 left-3 z-10 flex items-center gap-1.5">
        {modules.map(([key, count]) => (
          <button
            key={key}
            onClick={() => simAPI.toggleModule(key)}
            className="flex items-center gap-1 px-2 py-0.5"
            style={{
              backgroundColor: COLORS.amber,
              color: COLORS.charcoal,
              borderRadius: 9999,
              fontFamily: FONTS.mono,
              fontSize: 10,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 150ms ease, background-color 150ms ease',
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.95)')}
            onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
          >
            {MODULE_NAMES[key] || key}
            <span style={{ fontSize: 8, opacity: 0.7 }}>×{count}</span>
          </button>
        ))}
      </div>

      <canvas
        id="brainCanvas"
        ref={brainCanvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Neuron tooltip */}
      {hoveredNeuron && (
        <div
          className="absolute z-20 animate-fadeIn"
          style={{
            top: '40%',
            left: '50%',
            backgroundColor: COLORS.deepBrown,
            borderRadius: 12,
            borderLeft: `2px solid ${COLORS.amber}`,
            padding: '10px 14px',
            maxWidth: 200,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.amber,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {hoveredNeuron.module}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.softCream, marginTop: 2 }}>
            {hoveredNeuron.type === 'R'
              ? 'Type R — Leaky Integrator'
              : hoveredNeuron.type === 'O'
                ? 'Type O — Oscillatory'
                : 'Input Sensor'}
          </div>
          <div
            style={{
              fontFamily: FONTS.heading,
              fontSize: 22,
              fontWeight: 700,
              color: COLORS.amber,
              marginTop: 4,
            }}
          >
            {(hoveredNeuron.output ?? 0).toFixed(3)}
          </div>
          {(hoveredNeuron.activityHistory ?? []).length > 0 && (
            <LineChart
              width={120}
              height={30}
              data={(hoveredNeuron.activityHistory ?? []).map((v, i) => ({ i, v }))}
            >
              <Line type="monotone" dataKey="v" stroke={COLORS.amber} dot={false} strokeWidth={1.5} />
            </LineChart>
          )}
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand, marginTop: 4 }}>
            ↓ {hoveredNeuron.inDegree ?? 0} in · {hoveredNeuron.outDegree ?? 0} out ↑
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainCanvas;
