import { useState, useEffect } from 'react';
import { useSimStore } from '@/lib/simContext';
import { aiService, AblationAnalystResult } from '@/lib/aiService';
import { COLORS, FONTS } from '@/lib/constants';
import { Microscope, Loader2, X, Activity } from 'lucide-react';

export default function AIAblationModal() {
  const showAblationModal = useSimStore((s) => s.showAblationModal);
  const setShowAblationModal = useSimStore((s) => s.setShowAblationModal);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AblationAnalystResult | null>(null);

  useEffect(() => {
    if (showAblationModal && !result && !loading) {
      runAnalysis();
    }
  }, [showAblationModal]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      // Simulate providing baseline vs ablation scores to the AI
      const baseline = 85.2;
      const scores = { 'Rhythm Module': 40.2, 'Sensory Module (Acoustic)': 55.2 };
      const res = await aiService.analyzeAblation(baseline, scores);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!showAblationModal) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg flex flex-col overflow-hidden shadow-2xl"
        style={{
          backgroundColor: COLORS.deepBrown,
          border: `1px solid ${COLORS.amber}`,
          borderRadius: 16,
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20" style={{ backgroundColor: COLORS.midDark }}>
          <div className="flex items-center gap-2">
            <Microscope size={18} color={COLORS.amber} />
            <h2 style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 16 }}>
              AI Auto-Ablation Analyst
            </h2>
          </div>
          <button 
            onClick={() => setShowAblationModal(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={18} color={COLORS.sand} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <Microscope size={32} color={COLORS.amber} className="animate-pulse" />
                <Loader2 className="absolute -bottom-2 -right-2 animate-spin bg-deepBrown rounded-full" size={16} color={COLORS.sand} />
              </div>
              <p className="text-center" style={{ fontFamily: FONTS.mono, color: COLORS.sand, fontSize: 12 }}>
                Running parallel background trials...<br/>
                Isolating and severing modules to evaluate survival drop-off.
              </p>
            </div>
          ) : result ? (
            <div className="animate-fadeIn flex flex-col gap-6">
              
              <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                <div className="flex items-start gap-3">
                  <Activity size={18} color={COLORS.softCream} className="shrink-0 mt-0.5" />
                  <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.sand, lineHeight: 1.5 }}>
                    {result.summary}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 px-1" style={{ fontFamily: FONTS.mono, color: COLORS.amber, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Module Dominance Ranking
                </h3>
                <div className="flex flex-col gap-3">
                  {result.importanceRanking.map((rank, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded-lg border border-amber-500/10 flex flex-col gap-2 relative overflow-hidden"
                      style={{ backgroundColor: COLORS.midDark }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: i === 0 ? COLORS.burnt : COLORS.amber, opacity: 0.8 }} />
                      <div className="flex items-center justify-between pl-2">
                        <span className="font-bold tracking-wide" style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 14 }}>
                          {rank.module}
                        </span>
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sand }}>Penalty:</span>
                          <span className="px-2 py-0.5 rounded font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontFamily: FONTS.mono, fontSize: 12 }}>
                            -{rank.scoreDrop} pts
                          </span>
                        </div>
                      </div>
                      <p className="pl-2" style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.sand, lineHeight: 1.4 }}>
                        {rank.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}