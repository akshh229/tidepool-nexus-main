import { useState } from 'react';
import { useSimStore } from '@/lib/simContext';
import { aiService, ScenarioBuilderResult } from '@/lib/aiService';
import { COLORS, FONTS } from '@/lib/constants';
import { Sparkles, Loader2, X, Send } from 'lucide-react';

export default function AIBuilderModal() {
  const showAIBuilder = useSimStore((s) => s.showAIBuilderModal);
  const setShowAIBuilder = useSimStore((s) => s.setShowAIBuilderModal);
  
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioBuilderResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await aiService.buildScenarioFromText(prompt);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const overrideScenario = () => {
    // Ideally map these stats into simAPI parameters
    console.log("Applying config:", result?.config);
    alert(`Scenario applied: \n${JSON.stringify(result?.config, null, 2)}`);
    setShowAIBuilder(false);
  };

  if (!showAIBuilder) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg flex flex-col overflow-hidden shadow-2xl"
        style={{
          backgroundColor: COLORS.deepBrown,
          border: `1px solid ${COLORS.softCream}44`,
          borderRadius: 16,
        }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: COLORS.midDark, borderColor: `${COLORS.softCream}22` }}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} color={COLORS.softCream} />
            <h2 style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 16 }}>
              Natural Language Scenario Builder
            </h2>
          </div>
          <button 
            onClick={() => setShowAIBuilder(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={18} color={COLORS.sand} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto max-h-[70vh]">
          <p className="mb-4" style={{ fontFamily: FONTS.body, color: COLORS.sand, fontSize: 13 }}>
            Describe the kind of simulation you want to run. The AI will translate your intent into physical parameters and module configuration.
          </p>
          
          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A harsh environment with high predator count and very short days"
              disabled={loading}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30"
              style={{ fontFamily: FONTS.body }}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ 
                backgroundColor: COLORS.softCream,
                color: COLORS.deepBrown,
                fontFamily: FONTS.mono 
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>

          {result && !loading && (
            <div className="animate-fadeIn mt-6 pt-6 border-t border-white/10">
              <h3 className="mb-2" style={{ fontFamily: FONTS.heading, color: COLORS.softCream, fontSize: 14 }}>
                Generated Role: {result.scenarioName}
              </h3>
              <p className="mb-4 text-sm" style={{ fontFamily: FONTS.body, color: COLORS.sand }}>
                {result.explanation}
              </p>
              
              <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: COLORS.midDark, border: '1px solid rgba(255,255,255,0.05)' }}>
                <pre style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.amber }} className="whitespace-pre-wrap">
                  {JSON.stringify(result.config, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 rounded text-xs"
                  style={{ color: COLORS.sand, backgroundColor: 'transparent', border: `1px solid ${COLORS.sand}44` }}
                >
                  Discard
                </button>
                <button
                  onClick={overrideScenario}
                  className="px-4 py-2 rounded text-xs font-semibold"
                  style={{ backgroundColor: COLORS.amber, color: COLORS.deepBrown }}
                >
                  Start Scenario
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
