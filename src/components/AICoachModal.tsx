import { useState, useEffect } from 'react';
import { useSimStore } from '@/lib/simContext';
import { simAPI } from '@/simAPI.js';
import { aiService, AIRecommendation } from '@/lib/aiService';
import { COLORS, FONTS } from '@/lib/constants';
import { Bot, Sparkles, Loader2, X, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AICoachModal() {
  const showAICoach = useSimStore((s) => s.showAICoachModal);
  const setShowAICoach = useSimStore((s) => s.setShowAICoachModal);
  const stats = useSimStore((s) => s.stats);
  
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AIRecommendation | null>(null);

  useEffect(() => {
    if (showAICoach && !insight && !loading) {
      handleAnalyze();
    }
  }, [showAICoach]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Pass a simplified trial summary
      const summary = {
        step: stats.step,
        predatorHits: stats.predatorHits,
        energy: stats.energy,
        avgWeight: stats.avgWeightMagnitude,
        learningEnabled: stats.learningEnabled
      };
      const res = await aiService.analyzeTrial(summary);
      setInsight(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const applyChange = (param: string, value: number) => {
    // In a full implementation, you would call something like simAPI.setParameter(param, value)
    console.log(`Applying AI Recommendation: ${param} = ${value}`);
    // Just closing or showing a toast for now
    alert(`Applied ${param} = ${value}`);
  };

  if (!showAICoach) return null;

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
            <Bot size={18} color={COLORS.amber} />
            <h2 style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 16 }}>
              AI Experiment Coach
            </h2>
          </div>
          <button 
            onClick={() => setShowAICoach(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={18} color={COLORS.sand} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="animate-spin" size={32} color={COLORS.amber} />
              <p style={{ fontFamily: FONTS.mono, color: COLORS.sand, fontSize: 12 }}>
                Analyzing neural dynamics & telemetry...
              </p>
            </div>
          ) : insight ? (
            <div className="flex flex-col gap-6">
              
              {/* Root Causes */}
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h3 style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 14 }}>
                    Identified Bottlenecks
                  </h3>
                </div>
                <ul className="space-y-2">
                  {insight.rootCauses.map((cause, i) => (
                    <li key={i} className="flex gap-2 text-sm text-red-200/80 font-body">
                      <span className="text-red-500">•</span> {cause}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priorities & Actionables */}
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <TrendingUp size={16} color={COLORS.amber} />
                  <h3 style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 14 }}>
                    Recommended Parameters (Confidence: {insight.confidenceLevel}%)
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {insight.priorityChanges.map((rec, i) => (
                    <div 
                      key={i} 
                      className="p-3 rounded-lg border border-amber-500/20 flex flex-col md:flex-row md:items-center gap-3 justify-between"
                      style={{ backgroundColor: COLORS.midDark }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code 
                            className="px-2 py-0.5 rounded text-xs" 
                            style={{ backgroundColor: COLORS.deepBrown, color: COLORS.amber, fontFamily: FONTS.mono }}
                          >
                            {rec.parameter}
                          </code>
                          <span className="text-xs text-white/50">→</span>
                          <code 
                            className="px-2 py-0.5 rounded text-xs font-bold" 
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: COLORS.softCream, fontFamily: FONTS.mono }}
                          >
                            {rec.value}
                          </code>
                        </div>
                        <p style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.sand, lineHeight: 1.4 }}>
                          {rec.reasoning}
                        </p>
                      </div>
                      <button
                        onClick={() => applyChange(rec.parameter, rec.value)}
                        className="px-4 py-2 rounded text-xs font-semibold shrink-0 cursor-pointer flex items-center justify-center gap-2"
                        style={{ 
                          backgroundColor: COLORS.amber,
                          color: COLORS.charcoal,
                          fontFamily: FONTS.mono 
                        }}
                      >
                        <Sparkles size={12} />
                        Apply Fix
                      </button>
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
