import { useSimStore } from '@/lib/simContext';
import { COLORS, FONTS } from '@/lib/constants';

const flowNodes = [
  { label: 'SENSORS', modules: ['Chemical', 'Acoustic L', 'Acoustic R', 'Vision', 'Internal'], avgOutput: 0.42 },
];

const middleModules = [
  { label: 'CHEMO', avg: 0.38, count: 52, color: COLORS.amber },
  { label: 'PREDATOR', avg: 0.21, count: 26, color: COLORS.burnt },
  { label: 'SHELTER', avg: 0.15, count: 22, color: COLORS.mutedGold },
];

const outputModules = [
  { label: 'VALUE', avg: 0.44, count: 14, color: COLORS.amber },
  { label: 'MOTOR', avg: 0.67, count: 62, color: COLORS.sand },
];

const SignalFlowModal = () => {
  const setShow = useSimStore((s) => s.setShowSignalFlowModal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signal-flow-title"
      style={{ backgroundColor: `${COLORS.deepest}e6` }}
      onClick={() => setShow(false)}
      onKeyDown={(e) => { if (e.key === 'Escape') setShow(false); }}
    >
      <div
        className="animate-fadeIn w-full max-w-[640px] mx-4"
        style={{
          backgroundColor: COLORS.deepBrown,
          borderRadius: 16,
          borderTop: `3px solid ${COLORS.amber}`,
          padding: 32,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setShow(false)}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            color: COLORS.amber,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
          }}
        >
          ✕
        </button>

        <h2
          id="signal-flow-title"
          style={{
            fontFamily: FONTS.heading,
            fontSize: 24,
            fontWeight: 700,
            color: COLORS.amber,
            marginBottom: 4,
          }}
        >
          Signal Flow Trace
        </h2>
        <p style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.sand, marginBottom: 24 }}>
          Two functional circuits traced sensor-to-output
        </p>

        {/* Flow diagram */}
        <div className="flex items-center justify-between mb-6" style={{ gap: 12 }}>
          {/* Sensors */}
          <FlowNode label="SENSORS" subtitle="30 inputs" avg="—" color={COLORS.sand} />

          <Arrow />

          {/* Middle modules */}
          <div className="flex flex-col gap-2">
            {middleModules.map((m) => (
              <FlowNode key={m.label} label={m.label} subtitle={`×${m.count}`} avg={m.avg.toFixed(2)} color={m.color} />
            ))}
          </div>

          <Arrow />

          {/* Output modules */}
          <div className="flex flex-col gap-2">
            {outputModules.map((m) => (
              <FlowNode key={m.label} label={m.label} subtitle={`×${m.count}`} avg={m.avg.toFixed(2)} color={m.color} />
            ))}
          </div>

          <Arrow />

          {/* Outputs */}
          <FlowNode label="OUTPUT" subtitle="3 signals" avg="—" color={COLORS.amber} />
        </div>

        {/* Circuit descriptions */}
        <div className="flex flex-col gap-3">
          <CircuitCard
            borderColor={COLORS.amber}
            title="Circuit 1: Chemical Frequency Decoder"
            flow="Chemical Sensor → Type O Bank (T=6,10,16,24) → Food Evidence Neurons → Value Memory → Eat Gate → eat output"
            note="Type O neurons tuned to each food's temporal pulse period. Value memory re-learns nutritious types after each 600-step rotation."
          />
          <CircuitCard
            borderColor={COLORS.burnt}
            title="Circuit 2: Acoustic ILD Comparator"
            flow="Acoustic L + R Sensors → Type O Banks (ω≈0.295) → L/R Comparison → Danger Level → Motor Steering → turn_rate output"
            note="Interaural level and phase differences between the two ears encode predator direction in egocentric coordinates."
          />
        </div>
      </div>
    </div>
  );
};

const FlowNode = ({ label, subtitle, avg, color }: { label: string; subtitle: string; avg: string; color: string }) => (
  <div
    className="flex flex-col items-center px-3 py-2"
    style={{
      backgroundColor: COLORS.midDark,
      borderRadius: 8,
      minWidth: 80,
    }}
  >
    <span style={{ fontFamily: FONTS.mono, fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
    <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: COLORS.sand }}>{subtitle}</span>
    {avg !== '—' && (
      <span style={{ fontFamily: FONTS.mono, fontSize: 14, color: COLORS.amber, marginTop: 2 }}>
        {avg}
      </span>
    )}
  </div>
);

const Arrow = () => (
  <svg width={24} height={12} viewBox="0 0 24 12">
    <line x1={0} y1={6} x2={20} y2={6} stroke={COLORS.amber} strokeWidth={2} />
    <polygon points="18,2 24,6 18,10" fill={COLORS.amber} />
  </svg>
);

const CircuitCard = ({ borderColor, title, flow, note }: { borderColor: string; title: string; flow: string; note: string }) => (
  <div
    className="p-3"
    style={{
      backgroundColor: COLORS.midDark,
      borderRadius: 12,
      borderLeft: `2px solid ${borderColor}`,
    }}
  >
    <div style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 600, color: COLORS.amber, marginBottom: 4 }}>
      {title}
    </div>
    <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.softCream, lineHeight: 1.6, marginBottom: 6 }}>
      {flow}
    </div>
    <div style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.sand, lineHeight: 1.5 }}>
      {note}
    </div>
  </div>
);

export default SignalFlowModal;
