import { useSimStore } from '@/lib/simContext';
import { COLORS, FONTS } from '@/lib/constants';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

import { aiService } from '@/lib/aiService';
import { useState } from 'react';
import { RefreshCcw, Activity } from 'lucide-react';

const CentreMetrics = () => {
  const stats = useSimStore((s) => s.stats);
  const [analyzingDrift, setAnalyzingDrift] = useState(false);
  const [driftResult, setDriftResult] = useState<any>(null);

  const analyzeDrift = async () => {
    setAnalyzingDrift(true);
    try {
      const res = await aiService.detectStrategyDrift([stats]);
      setDriftResult(res);
      setTimeout(() => setDriftResult(null), 8000); // clear after 8s
    } catch (e) {
      console.error(e);
    }
    setAnalyzingDrift(false);
  };

  const energyData = useMemo(
    () => stats.energyHistory.map((v, i) => ({ i, v })),
    [stats.energyHistory]
  );
  const foragingData = useMemo(
    () => stats.correctEatHistory.map((v, i) => ({ i, correct: v, toxic: 100 - v })),
    [stats.correctEatHistory]
  );
  const activityData = useMemo(
    () => stats.activityCostHistory.map((v, i) => ({ i, v })),
    [stats.activityCostHistory]
  );

  const activityMean = useMemo(() => {
    if (stats.activityCostHistory.length === 0) return 0;
    return (
      stats.activityCostHistory.reduce((a, b) => a + b, 0) / stats.activityCostHistory.length
    );
  }, [stats.activityCostHistory]);

  const charts = [
    {
      title: 'Foraging Accuracy',
      shadow: true,
      content: (
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={foragingData}>
            <XAxis dataKey="i" hide />
            <YAxis domain={[0, 100]} hide />
            <Line type="monotone" dataKey="correct" stroke={COLORS.amber} dot={false} strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="toxic"
              stroke={COLORS.burnt}
              dot={false}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Energy Over Time',
      shadow: false,
      content: (
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={energyData}>
            <XAxis dataKey="i" hide />
            <YAxis domain={[0, 300]} hide />
            <Line type="monotone" dataKey="v" stroke={COLORS.amber} dot={false} strokeWidth={2} />
            {stats.predatorHitSteps.map((step) => (
              <ReferenceLine
                key={step}
                x={step}
                stroke={COLORS.burnt}
                strokeOpacity={0.5}
                strokeWidth={1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Activity Cost A(t)',
      shadow: true,
      content: (
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={activityData}>
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Line type="monotone" dataKey="v" stroke={COLORS.mutedGold} dot={false} strokeWidth={1.5} />
            <ReferenceLine
              y={activityMean}
              stroke={COLORS.sand}
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{
                value: 'trial mean',
                position: 'right',
                fill: COLORS.sand,
                fontSize: 9,
                fontFamily: FONTS.mono,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div
      className="flex gap-3 p-3 overflow-hidden relative"
      style={{ backgroundColor: COLORS.deepBrown }}
    >
      {driftResult && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-950/90 border border-red-500/30 backdrop-blur-md">
          <Activity size={14} className="text-red-400" />
          <span className="text-red-200 text-xs font-mono font-bold tracking-wider uppercase">
            Strategy Drift Detected
          </span>
          <span className="text-red-100/70 text-xs font-body ml-2">
            {driftResult.degradingBehaviors[0]}
          </span>
        </div>
      )}

      {/* Analyze Drift Button overlay */}
      <button
        onClick={analyzeDrift}
        disabled={analyzingDrift}
        className="absolute top-4 right-4 z-40 p-1.5 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
        title="AI Strategy Drift Detector"
      >
        <RefreshCcw size={12} color={COLORS.sand} className={analyzingDrift ? 'animate-spin' : ''} />
      </button>

      {charts.map((chart, idx) => (
        <div
          key={idx}
          className="flex-1 flex flex-col p-3"
          style={{
            backgroundColor: COLORS.midDark,
            borderRadius: idx === 0 ? 16 : idx === 2 ? 12 : 14,
            boxShadow: chart.shadow ? `0 0 12px rgba(232,168,56,0.15)` : 'none',
          }}
        >
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.amber,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            {chart.title}
          </span>
          {chart.content}
        </div>
      ))}
    </div>
  );
};

export default CentreMetrics;
