import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';
import { COLORS, FONTS, SCENARIO_INFO } from '@/lib/constants';

const LeftControlPanel = () => {
  const leftPanelOpen = useSimStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useSimStore((s) => s.setLeftPanelOpen);
  const stats = useSimStore((s) => s.stats);
  const scenario = useSimStore((s) => s.scenario);
  const ablations = useSimStore((s) => s.ablations);
  const toggleAblation = useSimStore((s) => s.toggleAblation);

  const ablationItems = [
    { key: 'disableLearning' as const, label: 'Disable Learning', apiKey: 'learning' },
    { key: 'noPredatorModule' as const, label: 'No Predator Module', apiKey: 'predatorModule' },
    { key: 'noShelterTiming' as const, label: 'No Shelter Timing', apiKey: 'shelterTiming' },
  ];

  const getEventColor = (ev: string) => {
    if (ev.includes('Nutrition')) return COLORS.amber;
    if (ev.includes('Predator') || ev.includes('Toxic')) return COLORS.burnt;
    if (ev.toLowerCase().includes('shelter')) return COLORS.mutedGold;
    return COLORS.sand;
  };

  if (!leftPanelOpen) {
    return (
      <div
        className="flex items-start justify-center pt-3"
        style={{
          backgroundColor: COLORS.deepBrown,
          borderRight: `1px solid rgba(232,168,56,0.2)`,
          width: 32,
        }}
      >
        <button
          onClick={() => setLeftPanelOpen(true)}
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
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        backgroundColor: COLORS.deepBrown,
        borderRight: `1px solid rgba(232,168,56,0.2)`,
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
          Controls
        </span>
        <button
          onClick={() => setLeftPanelOpen(false)}
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

      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-2 flex flex-col gap-3">
        {/* Ablation Studies */}
        <div>
          <div
            className="mb-2 pb-1"
            style={{
              borderTop: `1px solid rgba(232,168,56,0.3)`,
              paddingTop: 8,
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: COLORS.sand,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Ablation Studies
          </div>
          {ablationItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.softCream }}>
                  {item.label}
                </span>
                {ablations[item.key] && (
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 8,
                      color: COLORS.burnt,
                      padding: '1px 4px',
                      borderRadius: 4,
                      backgroundColor: `${COLORS.burnt}22`,
                    }}
                  >
                    ABLATED
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  toggleAblation(item.key);
                  simAPI.toggleAblation(item.apiKey);
                }}
                style={{
                  width: 28,
                  height: 14,
                  borderRadius: 9999,
                  backgroundColor: ablations[item.key] ? COLORS.amber : COLORS.midDark,
                  border: `1px solid ${ablations[item.key] ? COLORS.amber : COLORS.sand}44`,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 150ms ease',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: COLORS.softCream,
                    position: 'absolute',
                    top: 1,
                    left: ablations[item.key] ? 15 : 1,
                    transition: 'left 150ms ease',
                  }}
                />
              </button>
            </div>
          ))}

          {/* AI Ablation Trigger */}
          <div className="mt-4 pt-4 border-t border-dashed border-amber-500/20">
            <button
              onClick={() => {
                alert("Initiating parallel Auto-Ablation runs...\nThis will automatically ablate modules one by one, score them against a baseline, and report importances.");
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded"
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.deepBrown,
                backgroundColor: COLORS.amber,
                opacity: 0.9,
              }}
            >
              <span>🔬 AI Ablation Analysis</span>
            </button>
          </div>
        </div>

        {/* Scenario info */}
        <div
          className="p-2.5"
          style={{
            backgroundColor: COLORS.midDark,
            borderRadius: 8,
            borderLeft: `2px solid ${COLORS.amber}`,
          }}
        >
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.softCream,
              marginBottom: 4,
              textTransform: 'capitalize',
            }}
          >
            {scenario}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.sand, lineHeight: 1.5 }}>
            {SCENARIO_INFO[scenario]}
          </div>
        </div>

        {/* Event log */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            className="mb-1"
            style={{
              fontFamily: FONTS.mono,
              fontSize: 8,
              color: COLORS.sand,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Event Log
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar" style={{ maxHeight: 180 }}>
            {stats.eventLog.slice(0, 15).map((ev, i) => (
              <div
                key={i}
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: getEventColor(ev),
                  lineHeight: 1.8,
                }}
              >
                {ev}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export button */}
      <div className="px-3 py-2">
        <button
          onClick={() => simAPI.exportData()}
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
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = `${COLORS.amber}15`)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
          }
        >
          ↓ Export Run Data
        </button>
      </div>
    </div>
  );
};

export default LeftControlPanel;
