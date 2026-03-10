import { useEffect, useRef } from 'react';
import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';
import { COLORS, FONTS } from '@/lib/constants';
import { LineChart, Line } from 'recharts';

const WorldCanvas = ({ isMaxView, onMaxView }: { isMaxView: boolean; onMaxView: () => void }) => {
  const worldCanvasRef = useRef<HTMLCanvasElement>(null);
  const stats = useSimStore((s) => s.stats);
  const sensorOverlay = useSimStore((s) => s.sensorOverlay);
  const currentsOverlay = useSimStore((s) => s.currentsOverlay);
  const pathsOverlay = useSimStore((s) => s.pathsOverlay);
  const raysOverlay = useSimStore((s) => s.raysOverlay);
  const toggleSensor = useSimStore((s) => s.toggleSensorOverlay);
  const toggleCurrents = useSimStore((s) => s.toggleCurrentsOverlay);
  const togglePaths = useSimStore((s) => s.togglePathsOverlay);
  const toggleRays = useSimStore((s) => s.toggleRaysOverlay);

  useEffect(() => {
    if (!worldCanvasRef.current) return;
    simAPI.mountWorldCanvas(worldCanvasRef.current);
    const observer = new ResizeObserver(() => {
      const canvas = worldCanvasRef.current;
      if (canvas) {
        canvas.dispatchEvent(
          new CustomEvent('containerResized', {
            detail: { width: canvas.clientWidth, height: canvas.clientHeight },
          })
        );
      }
    });
    if (worldCanvasRef.current.parentElement)
      observer.observe(worldCanvasRef.current.parentElement);
    return () => observer.disconnect();
  }, []);

  const isNight = stats.daylight < 0.3;
  const toggleButtons = [
    { label: '👁', key: 'Sensors', active: sensorOverlay, toggle: toggleSensor },
    { label: '🌊', key: 'Currents', active: currentsOverlay, toggle: toggleCurrents },
    { label: '🔀', key: 'Paths', active: pathsOverlay, toggle: togglePaths },
    { label: '📡', key: 'Rays', active: raysOverlay, toggle: toggleRays },
  ];

  const foodLegend = [
    { label: 'A', color: COLORS.amber },
    { label: 'B', color: COLORS.burnt },
    { label: 'C', color: COLORS.sand },
    { label: 'D', color: COLORS.mutedGold },
  ];

  return (
    <div
      className={`relative overflow-hidden ${isMaxView ? 'fixed inset-0 z-50 w-screen h-screen' : 'flex-shrink-0'}`}
      style={{
        ...(!isMaxView ? { width: '55%', border: `1px solid rgba(232,168,56,0.25)`, borderTopLeftRadius: 16 } : {}),
        backgroundColor: COLORS.deepest,
      }}
    >
      {/* Label */}
      <div
        className="absolute top-2 left-0 z-10 px-2 py-1"
        style={{
          fontFamily: FONTS.mono,
          fontSize: 9,
          color: COLORS.amber,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderLeft: `2px solid ${COLORS.amber}`,
        }}
      >
        World View
      </div>

      {/* Max View button */}
      <button
        onClick={onMaxView}
        title={isMaxView ? 'Exit Max View' : 'Max View'}
        className="absolute top-2 left-24 z-10 ml-auto text-xs text-amber-400 hover:text-white border border-amber-400/30 hover:border-amber-400 px-2 py-0.5 rounded transition-all"
        style={{ fontFamily: FONTS.mono, fontSize: 9 }}
      >
        {isMaxView ? '⊠ Exit' : '⛶ Max'}
      </button>

      <canvas
        id="worldCanvas"
        ref={worldCanvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Top-right overlays */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
        {/* Day/Night */}
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{
            backgroundColor: `${COLORS.deepBrown}cc`,
            borderRadius: 9999,
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: COLORS.amber,
            transition: 'opacity 500ms ease',
          }}
        >
          <span style={{ transition: 'opacity 500ms ease' }}>{isNight ? '🌙' : '☀️'}</span>
          <span>{stats.daylight.toFixed(2)}</span>
        </div>

        {/* Nutrition phase with cross-fade */}
        <div style={{ position: 'relative', height: 24 }}>
          <div
            key={stats.nutritionPhase}
            className="px-2 py-1"
            style={{
              backgroundColor: `${COLORS.deepBrown}cc`,
              borderRadius: 9999,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.amber,
              animation: 'fadeIn 400ms ease forwards',
            }}
          >
            Phase: {stats.nutritionPhase}
          </div>
        </div>

        {/* Shelter status (night only) */}
        {isNight && (
          <div
            className="px-2 py-1"
            style={{
              backgroundColor: `${COLORS.deepBrown}cc`,
              borderRadius: 9999,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: stats.nightInShelter > 0.5 ? COLORS.amber : COLORS.burnt,
            }}
          >
            {stats.nightInShelter > 0.5 ? '🏠 IN SHELTER' : '⚠ EXPOSED'}
          </div>
        )}
      </div>

      {/* Top-left toggle buttons */}
      <div className="absolute top-8 left-2 z-10 flex flex-col gap-1">
        {toggleButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={btn.toggle}
            title={btn.key}
            className="flex items-center gap-1 px-2 py-1"
            style={{
              backgroundColor: btn.active ? COLORS.amber : `${COLORS.deepBrown}cc`,
              color: btn.active ? COLORS.charcoal : COLORS.amber,
              borderRadius: 9999,
              fontFamily: FONTS.mono,
              fontSize: 10,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            <span>{btn.label}</span>
            <span>{btn.key}</span>
          </button>
        ))}
      </div>

      {/* Bottom-left readout */}
      <div
        className="absolute bottom-2 left-2 z-10 px-2 py-1.5"
        style={{
          backgroundColor: `${COLORS.deepBrown}cc`,
          borderRadius: 8,
          fontFamily: FONTS.mono,
          fontSize: 10,
          color: COLORS.softCream,
          lineHeight: 1.8,
        }}
      >
        <div>Speed: {stats.speed.toFixed(2)} u/step</div>
        <div>Pos: ({stats.position.x.toFixed(1)}, {stats.position.y.toFixed(1)})</div>
        <div>θ: {stats.heading.toFixed(2)} rad</div>
      </div>

      {/* Bottom-right food legend */}
      <div
        className="absolute bottom-2 right-2 z-10 flex items-center gap-2 px-2 py-1"
        style={{
          backgroundColor: `${COLORS.deepBrown}cc`,
          borderRadius: 8,
          fontFamily: FONTS.mono,
          fontSize: 9,
        }}
      >
        {foodLegend.map((f) => (
          <span key={f.label} className="flex items-center gap-1" style={{ color: f.color }}>
            ■ {f.label}
          </span>
        ))}
      </div>

      {/* Sensor debug panel */}
      {sensorOverlay && (
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 px-3 py-2"
          style={{
            backgroundColor: COLORS.deepest,
            borderRadius: 12,
            borderTop: `2px solid ${COLORS.amber}`,
          }}
        >
          <div className="flex gap-3">
            {[
              { label: 'Chemical Signal', data: stats.chemicalHistory, color: COLORS.amber },
              { label: 'Acoustic L', data: stats.acousticLHistory, color: COLORS.softCream },
              { label: 'Acoustic R', data: stats.acousticRHistory, color: COLORS.sand },
            ].map((ch) => (
              <div key={ch.label} className="flex flex-col items-center">
                <span
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    color: COLORS.amber,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 2,
                  }}
                >
                  {ch.label}
                </span>
                <LineChart width={120} height={30} data={ch.data.map((v, i) => ({ i, v }))}>
                  <Line type="monotone" dataKey="v" stroke={ch.color} dot={false} strokeWidth={1.5} />
                </LineChart>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldCanvas;
