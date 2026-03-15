import { useSimStore } from '@/lib/simContext';
import { COLORS, FONTS, MAX_STEPS, MAX_TRIALS } from '@/lib/constants';
import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';

const TopHeaderBar = () => {
  const stats = useSimStore((s) => s.stats);
  const isRunning = useSimStore((s) => s.isRunning);
  const simReady = useSimStore((s) => s.simReady);
  const setShowAICoachModal = useSimStore((s) => s.setShowAICoachModal);
  const setShowAIBuilderModal = useSimStore((s) => s.setShowAIBuilderModal);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const statusLabel = !simReady ? 'INITIALISING' : isRunning ? 'RUNNING' : 'PAUSED';
  const statusColor = !simReady ? COLORS.burnt : isRunning ? COLORS.amber : COLORS.sand;
  const dotAnimation = !simReady
    ? 'slowBlink 2s ease infinite'
    : isRunning
      ? 'statusPulse 1.2s ease-in-out infinite'
      : 'none';

  return (
    <header
      className="flex items-center justify-between px-5"
      style={{ backgroundColor: COLORS.deepBrown, height: 52 }}
    >
      {/* Left */}
      <div className="flex flex-col min-w-0">
        <span
          style={{
            fontFamily: FONTS.heading,
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.softCream,
            lineHeight: 1.2,
          }}
        >
          The Tidepool Brain
        </span>
        <span
          style={{
            fontFamily: FONTS.body,
            fontSize: 10,
            fontWeight: 300,
            color: COLORS.sand,
            lineHeight: 1.2,
          }}
        >
          Modular Neural Controller · HACKBIO '26 · Kamand Bioengineering Group
        </span>
      </div>

      {/* Centre */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex items-center gap-2 px-3 py-1"
          style={{
            backgroundColor: COLORS.midDark,
            borderRadius: 9999,
            border: `1px solid rgba(232,168,56,0.3)`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: statusColor,
              animation: dotAnimation,
            }}
          />
          <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: statusColor, fontWeight: 500 }}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-2 py-0.5"
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.amber,
              backgroundColor: COLORS.midDark,
              borderRadius: 9999,
            }}
          >
            🔄 Nutrition in: {stats.stepsToNutritionRotation} steps
          </span>
          <span
            className="px-2 py-0.5"
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: COLORS.softCream,
              backgroundColor: COLORS.midDark,
              borderRadius: 9999,
            }}
          >
            🌙 Night in: {stats.stepsToNightfall} steps
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.softCream }}>
              Trial: {stats.currentTrial} / {MAX_TRIALS}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.softCream }}>
              Step: {stats.currentStep.toLocaleString()} / {MAX_STEPS.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              width: 180,
              height: 4,
              backgroundColor: COLORS.midDark,
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(stats.currentStep / MAX_STEPS) * 100}%`,
                height: '100%',
                backgroundColor: COLORS.amber,
                borderRadius: 9999,
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* AI Coach */}
          <button
            onClick={() => setShowAICoachModal(true)}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            title="AI Expeiment Coach"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: `${COLORS.amber}22`,
              color: COLORS.amber,
              border: `1px solid ${COLORS.amber}66`,
              cursor: 'pointer',
            }}
          >
            <Bot size={16} />
          </button>

          {/* AI Builder */}
          <button
            onClick={() => setShowAIBuilderModal(true)}
            className="flex items-center justify-center transition-opacity hover:opacity-80"
            title="AI Scenario Builder"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: `${COLORS.softCream}22`,
              color: COLORS.softCream,
              border: `1px solid ${COLORS.softCream}66`,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={16} />
          </button>

          {/* Keyboard shortcut button */}
          <div className="relative">
            <button
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: COLORS.midDark,
                color: COLORS.amber,
                fontFamily: FONTS.mono,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setShowShortcuts(true)}
              onMouseLeave={() => setShowShortcuts(false)}
            >
              ⌨
            </button>
          {showShortcuts && (
            <div
              className="absolute top-full right-0 mt-2 animate-fadeIn"
              style={{
                backgroundColor: COLORS.deepBrown,
                border: `1px solid rgba(232,168,56,0.3)`,
                borderRadius: 12,
                padding: '12px 16px',
                zIndex: 30,
                whiteSpace: 'pre',
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: COLORS.sand,
                lineHeight: 2,
                minWidth: 200,
              }}
            >
              <div style={{ color: COLORS.amber, fontSize: 9, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em' }}>
                Keyboard Shortcuts
              </div>
              {`Space   Play / Pause\nR       Reset\nS       Sensors overlay\nC       Currents overlay\nB       Brain fullscreen\nEsc     Close modals`}
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeaderBar;
