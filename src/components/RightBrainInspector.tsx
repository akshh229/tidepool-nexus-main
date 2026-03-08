import { useSimStore } from '@/lib/simContext';
import simAPI from '@/lib/mockSimAPI';
import { COLORS, FONTS, MAX_NEURONS, MAX_CONNECTIONS, SCORE_ROWS } from '@/lib/constants';
import { LineChart, Line } from 'recharts';
import type { AggregateScores } from '@/lib/types';

const RightBrainInspector = () => {
  const stats = useSimStore((s) => s.stats);
  const rightPanelOpen = useSimStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useSimStore((s) => s.setRightPanelOpen);
  const pinnedNeuron = useSimStore((s) => s.pinnedNeuron);
  const setPinnedNeuron = useSimStore((s) => s.setPinnedNeuron);
  const showScoreBreakdown = useSimStore((s) => s.showScoreBreakdown);
  const setShowScoreBreakdown = useSimStore((s) => s.setShowScoreBreakdown);
  const setShowSignalFlowModal = useSimStore((s) => s.setShowSignalFlowModal);

  if (!rightPanelOpen) {
    return (
      <div
        className="flex items-start justify-center pt-3"
        style={{
          backgroundColor: COLORS.deepBrown,
          borderLeft: `1px solid rgba(232,168,56,0.2)`,
          width: 32,
        }}
      >
        <button
          onClick={() => setRightPanelOpen(true)}
          style={{
            color: COLORS.amber,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONTS.mono,
            fontSize: 14,
          }}
        >
          ‹
        </button>
      </div>
    );
  }

  const activityFrac = Math.min(stats.activityCost / 50, 1);
  const arcAngle = activityFrac * 240;

  // SVG arc
  const cx = 50, cy = 50, r = 40;
  const startAngle = 150; // degrees
  const describeArc = (angle: number) => {
    const start = ((startAngle) * Math.PI) / 180;
    const end = ((startAngle + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = angle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const m1Frac = (stats.M1 + 1) / 2; // -1..+1 → 0..1
  const isAggregate = stats.aggregateScores !== null;

  const getScoreValue = (key: keyof AggregateScores, max: number) => {
    if (!stats.aggregateScores) return null;
    const raw = Math.min(stats.aggregateScores[key], 1);
    return (raw * max).toFixed(1);
  };

  const getTotalScore = () => {
    if (!stats.aggregateScores) return null;
    return SCORE_ROWS.reduce((sum, row) => {
      const raw = Math.min(stats.aggregateScores![row.key], 1);
      return sum + raw * row.max;
    }, 0).toFixed(1);
  };

  return (
    <div
      className="flex flex-col overflow-y-auto amber-scrollbar"
      style={{
        backgroundColor: COLORS.deepBrown,
        borderLeft: `1px solid rgba(232,168,56,0.2)`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid rgba(232,168,56,0.2)` }}
      >
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 9,
            color: COLORS.amber,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Brain Inspector
        </span>
        <button
          onClick={() => setRightPanelOpen(false)}
          style={{
            color: COLORS.amber,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONTS.mono,
            fontSize: 14,
          }}
        >
          ›
        </button>
      </div>

      <div className="flex flex-col gap-3 px-3 py-2">
        {/* Activity gauge */}
        <div className="flex flex-col items-center">
          <svg width={100} height={80} viewBox="0 0 100 80">
            <path
              d={describeArc(240)}
              fill="none"
              stroke={COLORS.midDark}
              strokeWidth={8}
              strokeLinecap="round"
            />
            <path
              d={describeArc(arcAngle)}
              fill="none"
              stroke={activityFrac > 0.7 ? COLORS.burnt : COLORS.amber}
              strokeWidth={8}
              strokeLinecap="round"
              style={{ transition: 'stroke 200ms ease' }}
            />
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              style={{
                fontFamily: FONTS.heading,
                fontSize: 16,
                fontWeight: 700,
                fill: COLORS.amber,
              }}
            >
              {stats.activityCost.toFixed(1)}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              style={{ fontFamily: FONTS.mono, fontSize: 7, fill: COLORS.sand }}
            >
              A(t) Activity Cost
            </text>
          </svg>
        </div>

        {/* Brain stats */}
        <div className="flex flex-col gap-1.5">
          <StatRow label="Neurons" value={`${stats.neuronCount} / ${MAX_NEURONS}`} />
          <StatBar value={stats.neuronCount} max={MAX_NEURONS} color={COLORS.amber} />
          <StatRow label="Connections" value={`${stats.connectionCount.toLocaleString()} / ${MAX_CONNECTIONS.toLocaleString()}`} />
          <StatBar value={stats.connectionCount} max={MAX_CONNECTIONS} color={COLORS.sand} />
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand }}>Learning</span>
            <span
              className="px-1.5 py-0.5"
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                borderRadius: 9999,
                backgroundColor: stats.learningEnabled ? COLORS.amber : COLORS.burnt,
                color: stats.learningEnabled ? COLORS.charcoal : COLORS.softCream,
              }}
            >
              {stats.learningEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <StatRow label="Avg |w|" value={stats.avgWeightMagnitude.toFixed(3)} />

          {/* M1 */}
          <div className="flex items-center justify-between mt-1">
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand }}>M1 Modulator</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: stats.M1 >= 0 ? COLORS.amber : COLORS.burnt }}>
              {stats.M1 >= 0 ? '+' : ''}{stats.M1.toFixed(2)}
            </span>
          </div>
          <div style={{ height: 4, backgroundColor: COLORS.midDark, borderRadius: 9999, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${Math.min(m1Frac, 0.5) * 100}%`,
                width: `${Math.abs(m1Frac - 0.5) * 100}%`,
                height: '100%',
                backgroundColor: stats.M1 >= 0 ? COLORS.amber : COLORS.burnt,
                borderRadius: 9999,
                transition: 'all 200ms ease',
              }}
            />
          </div>

          {/* M2 */}
          <div className="flex items-center justify-between mt-1">
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand }}>M2 Surprise</span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber }}>
              {stats.M2.toFixed(2)}
            </span>
          </div>
          <StatBar value={stats.M2} max={1} color={COLORS.amber} />
        </div>

        {/* Pinned neuron */}
        {pinnedNeuron && (
          <div
            className="p-2.5"
            style={{
              backgroundColor: COLORS.midDark,
              borderRadius: 12,
              borderTop: `2px solid ${COLORS.amber}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.amber, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Pinned Neuron
              </span>
              <button
                onClick={() => setPinnedNeuron(null)}
                style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.burnt, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕ Unpin
              </button>
            </div>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.amber, textTransform: 'uppercase' }}>
              {pinnedNeuron.module}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.softCream }}>
              {pinnedNeuron.type === 'R' ? 'Type R — Leaky Integrator' : pinnedNeuron.type === 'O' ? 'Type O — Oscillatory' : 'Input'}
            </div>
            <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.amber, margin: '4px 0' }}>
              {pinnedNeuron.output.toFixed(3)}
            </div>
            {pinnedNeuron.activityHistory.length > 0 && (
              <LineChart width={140} height={28} data={pinnedNeuron.activityHistory.map((v, i) => ({ i, v }))}>
                <Line type="monotone" dataKey="v" stroke={COLORS.amber} dot={false} strokeWidth={1.5} />
              </LineChart>
            )}
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand, marginTop: 4 }}>
              ↓ {pinnedNeuron.inDegree} in · {pinnedNeuron.outDegree} out ↑
            </div>
          </div>
        )}

        {/* Score breakdown */}
        <div>
          <button
            onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
            className="flex items-center gap-1 w-full"
            style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              color: COLORS.amber,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            📊 Score Estimates {showScoreBreakdown ? '▴' : '▾'}
          </button>

          {showScoreBreakdown && (
            <div className="flex flex-col gap-1.5 mt-1">
              {isAggregate && (
                <div
                  className="mb-1 pb-1"
                  style={{ borderBottom: `1px solid rgba(232,168,56,0.2)` }}
                >
                  <div style={{ fontFamily: FONTS.heading, fontSize: 11, color: COLORS.softCream }}>
                    Final Aggregate Scores
                  </div>
                  <div style={{ fontFamily: FONTS.heading, fontSize: 28, fontWeight: 700, color: COLORS.amber }}>
                    {getTotalScore()} / 50
                  </div>
                </div>
              )}

              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 8,
                  color: COLORS.sand,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {isAggregate ? '30-Trial Results' : 'Live Estimate'}
              </div>

              {SCORE_ROWS.map((row) => {
                const val = getScoreValue(row.key, row.max);
                const frac = val ? parseFloat(val) / row.max : 0;
                return (
                  <div key={row.key} className="flex items-center gap-2">
                    <span
                      className="flex-shrink-0"
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 10,
                        color: COLORS.sand,
                        width: 100,
                      }}
                    >
                      {row.label}
                    </span>
                    <div
                      className="flex-1"
                      style={{
                        height: 4,
                        backgroundColor: COLORS.midDark,
                        borderRadius: 9999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: val ? `${frac * 100}%` : '0%',
                          height: '100%',
                          backgroundColor: COLORS.amber,
                          borderRadius: 9999,
                          transition: 'width 200ms ease',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.amber, minWidth: 45, textAlign: 'right' }}>
                      {val ?? '--'} / {row.max}
                    </span>
                  </div>
                );
              })}

              <div style={{ fontFamily: FONTS.body, fontSize: 9, color: COLORS.sand, marginTop: 4 }}>
                {isAggregate ? '' : 'Final score averaged across 30 trials'}
              </div>

              {isAggregate && (
                <button
                  onClick={() => simAPI.exportData()}
                  style={{
                    padding: '4px 0',
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.amber,
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.amber}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  ↓ Download Results
                </button>
              )}
            </div>
          )}
        </div>

        {/* Trace signal flow */}
        <button
          onClick={() => setShowSignalFlowModal(true)}
          style={{
            width: '100%',
            padding: '6px 0',
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.amber,
            backgroundColor: 'transparent',
            border: `1px solid ${COLORS.amber}`,
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          🔍 Trace Signal Flow
        </button>
      </div>
    </div>
  );
};

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand }}>{label}</span>
    <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber }}>{value}</span>
  </div>
);

const StatBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div style={{ height: 4, backgroundColor: COLORS.midDark, borderRadius: 9999, overflow: 'hidden' }}>
    <div
      style={{
        width: `${Math.min((value / max) * 100, 100)}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: 9999,
        transition: 'width 200ms ease',
      }}
    />
  </div>
);

export default RightBrainInspector;
