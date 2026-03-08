import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';
import { COLORS, FONTS, MAX_ENERGY } from '@/lib/constants';
import { useEffect, useRef, useState } from 'react';

const scenarios = [
  { key: 'baseline' as const, label: '🌊 Baseline' },
  { key: 'heatwave' as const, label: '🌡 Heatwave' },
  { key: 'polluted' as const, label: '🧪 Polluted' },
];

const BottomHUD = () => {
  const stats = useSimStore((s) => s.stats);
  const isRunning = useSimStore((s) => s.isRunning);
  const setRunning = useSimStore((s) => s.setRunning);
  const timeScale = useSimStore((s) => s.timeScale);
  const setTimeScale = useSimStore((s) => s.setTimeScale);
  const scenario = useSimStore((s) => s.scenario);
  const setScenario = useSimStore((s) => s.setScenario);
  const energyFlashing = useSimStore((s) => s.energyFlashing);

  // Counter bump animation
  const [bumpCorrect, setBumpCorrect] = useState(false);
  const [bumpToxic, setBumpToxic] = useState(false);
  const [bumpPredator, setBumpPredator] = useState(false);
  const prevCorrect = useRef(stats.correctEats);
  const prevToxic = useRef(stats.toxicEats);
  const prevPredator = useRef(stats.predatorHits);

  useEffect(() => {
    if (stats.correctEats > prevCorrect.current) {
      setBumpCorrect(true);
      setTimeout(() => setBumpCorrect(false), 100);
    }
    prevCorrect.current = stats.correctEats;
  }, [stats.correctEats]);

  useEffect(() => {
    if (stats.toxicEats > prevToxic.current) {
      setBumpToxic(true);
      setTimeout(() => setBumpToxic(false), 100);
    }
    prevToxic.current = stats.toxicEats;
  }, [stats.toxicEats]);

  useEffect(() => {
    if (stats.predatorHits > prevPredator.current) {
      setBumpPredator(true);
      setTimeout(() => setBumpPredator(false), 100);
    }
    prevPredator.current = stats.predatorHits;
  }, [stats.predatorHits]);

  const hungerColor =
    stats.hunger < 0.3 ? COLORS.softCream : stats.hunger < 0.7 ? COLORS.amber : COLORS.burnt;

  // Reward badge
  const [showReward, setShowReward] = useState(false);
  const rewardTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (stats.reward !== 0) {
      setShowReward(true);
      clearTimeout(rewardTimer.current);
      rewardTimer.current = setTimeout(() => setShowReward(false), 500);
    }
  }, [stats.reward]);

  return (
    <div
      className="flex items-center justify-between px-5"
      style={{ backgroundColor: COLORS.deepBrown, height: 56 }}
    >
      {/* Left — vitals */}
      <div className="flex items-center gap-4">
        {/* Energy bar */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between" style={{ width: 160 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber }}>Energy</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber }}>
              {stats.energy.toFixed(0)} / {MAX_ENERGY}
            </span>
          </div>
          <div
            style={{
              width: 160,
              height: 8,
              backgroundColor: COLORS.midDark,
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <div
              className={energyFlashing ? 'energy-flash' : ''}
              style={{
                width: `${Math.min((stats.energy / MAX_ENERGY) * 100, 100)}%`,
                height: '100%',
                backgroundColor: COLORS.amber,
                borderRadius: 9999,
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>

        {/* Hunger */}
        <span
          className="px-2 py-0.5"
          style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: hungerColor,
            backgroundColor: COLORS.midDark,
            borderRadius: 9999,
          }}
        >
          Hunger {(stats.hunger * 100).toFixed(0)}%
        </span>

        {/* Reward — only visible when reward !== 0 */}
        {stats.reward !== 0 && (
          <span
            className="px-2 py-0.5 animate-fadeIn"
            style={{
              fontFamily: FONTS.mono,
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 9999,
              backgroundColor: stats.reward > 0 ? COLORS.amber : COLORS.burnt,
              color: stats.reward > 0 ? COLORS.charcoal : COLORS.softCream,
            }}
          >
            {stats.reward > 0 ? '+1' : '−1'}
          </span>
        )}
      </div>

      {/* Centre — controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (isRunning) {
              simAPI.pause();
              setRunning(false);
            } else {
              simAPI.start();
              setRunning(true);
            }
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: COLORS.amber,
            color: COLORS.charcoal,
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 100ms ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
          onMouseDown={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(0.95)')}
          onMouseUp={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.05)')}
        >
          {isRunning ? '⏸' : '▶'}
        </button>

        <button
          onClick={() => {
            simAPI.reset();
            setRunning(false);
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: COLORS.midDark,
            color: COLORS.amber,
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ↺
        </button>

        {/* Time scale */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber, minWidth: 32 }}>
            {timeScale.toFixed(1)}×
          </span>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={timeScale}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setTimeScale(v);
              simAPI.setTimeScale(v);
            }}
            style={{
              width: 80,
              accentColor: COLORS.amber,
            }}
          />
        </div>

        {/* Scenario */}
        <div
          className="flex items-center"
          style={{
            backgroundColor: COLORS.midDark,
            borderRadius: 9999,
            overflow: 'hidden',
          }}
        >
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                setScenario(s.key);
                simAPI.setScenario(s.key);
              }}
              style={{
                padding: '4px 10px',
                fontFamily: FONTS.body,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: scenario === s.key ? COLORS.amber : 'transparent',
                color: scenario === s.key ? COLORS.charcoal : COLORS.sand,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right — counters */}
      <div className="flex items-center gap-4">
        <span
          className={bumpCorrect ? 'counter-bump' : ''}
          style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.amber }}
        >
          ✓ {stats.correctEats}
        </span>
        <span
          className={bumpToxic ? 'counter-bump' : ''}
          style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.burnt }}
        >
          ✗ {stats.toxicEats}
        </span>
        <span
          className={bumpPredator ? 'counter-bump' : ''}
          style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.dangerRed }}
        >
          ⚡ {stats.predatorHits}
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.softCream }}>
          🌙 {Math.round(stats.nightInShelter * 100)}%
        </span>
      </div>
    </div>
  );
};

export default BottomHUD;
