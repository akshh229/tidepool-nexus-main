import { useSimStore } from '@/lib/simContext';
import { COLORS, FONTS } from '@/lib/constants';

const LoadingScreen = () => {
  const simReady = useSimStore((s) => s.simReady);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: COLORS.cream,
        opacity: simReady ? 0 : 1,
        pointerEvents: simReady ? 'none' : 'all',
        transition: 'opacity 600ms ease',
      }}
    >
      <h1
        style={{
          fontFamily: FONTS.heading,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.charcoal,
          letterSpacing: '-0.02em',
        }}
      >
        The Tidepool Brain
      </h1>
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 14,
          color: COLORS.sand,
          marginTop: 12,
          letterSpacing: '0.02em',
        }}
      >
        Kamand Bioengineering Group · HACKBIO '26
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: COLORS.amber,
              animation: `dotPulse 1.2s ease-in-out ${i * 200}ms infinite`,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: FONTS.mono,
          fontSize: 11,
          color: COLORS.mutedGold,
          marginTop: 24,
        }}
      >
        Loading neural network · Building world · Mounting canvases
      </p>
    </div>
  );
};

export default LoadingScreen;
