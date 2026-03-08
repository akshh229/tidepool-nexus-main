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

const CentreMetrics = () => {
  const stats = useSimStore((s) => s.stats);

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
      className="flex gap-3 p-3 overflow-hidden"
      style={{ backgroundColor: COLORS.deepBrown }}
    >
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
