export interface AIRecommendation {
  rootCauses: string[];
  confidenceLevel: number;
  priorityChanges: { parameter: string; value: number; reasoning: string }[];
}

export interface ScenarioBuilderResult {
  scenarioName: string;
  config: Record<string, any>;
  explanation: string;
}

export interface StrategyDriftResult {
  driftDetected: boolean;
  degradingBehaviors: string[];
  suggestedFixes: string[];
}

export interface AblationAnalystResult {
  importanceRanking: { module: string; scoreDrop: number; explanation: string }[];
  summary: string;
}

/**
 * Mocking responses until a real LLM API (OpenAI/Anthropic/Gemini) is integrated.
 * To use a real one, swap out these fetch calls for completions endpoints.
 */
export const aiService = {
  // 1. AI Experiment Coach
  analyzeTrial: async (trialSummary: any): Promise<AIRecommendation> => {
    console.log("Analyzing trial data...", trialSummary);
    await new Promise((r) => setTimeout(r, 1500)); // Simulate latency
    
    return {
      rootCauses: [
        "Sensory motor mapping delayed response under high predator pressure.",
        "Chemical sensor threshold too high, leading to starvation."
      ],
      confidenceLevel: 85,
      priorityChanges: [
        { parameter: "chemPulseThreshold", value: 12.5, reasoning: "Lower threshold to detect food earlier." },
        { parameter: "predatorFleeThrust", value: 1.2, reasoning: "Increase burst speed when avoiding predators." }
      ]
    };
  },

  // 2. Natural Language Scenario Builder
  buildScenarioFromText: async (prompt: string): Promise<ScenarioBuilderResult> => {
    console.log("Parsing scenario text:", prompt);
    await new Promise((r) => setTimeout(r, 1200));

    return {
      scenarioName: "High Danger Night Foraging",
      config: {
        predatorCount: 5,
        dayNightCycleMs: 400,
        foodAbundance: 0.5
      },
      explanation: "Increased predators to 5 and shortened day/night cycle to make it harder. Food abundance halved."
    };
  },

  // 3. Strategy Drift Detector
  detectStrategyDrift: async (historicalTrials: any[]): Promise<StrategyDriftResult> => {
    console.log("Analyzing history for drift...", historicalTrials.length, "trials");
    await new Promise((r) => setTimeout(r, 2000));

    return {
      driftDetected: true,
      degradingBehaviors: ["Failing to rotate nutrition mappings quickly enough after 600 steps"],
      suggestedFixes: ["Boost the learning rate in the Memory Module"]
    };
  },

  // 4. Auto-ablation Analyst
  analyzeAblation: async (baselineScore: number, ablationScores: Record<string, number>): Promise<AblationAnalystResult> => {
    console.log("Analyzing ablation results. Baseline:", baselineScore, "Ablations:", ablationScores);
    await new Promise((r) => setTimeout(r, 1800));

    return {
      importanceRanking: [
        { module: "Rhythm Module", scoreDrop: 45, explanation: "Critical for surviving night phases; removing it causes massive survival penalty." },
        { module: "Sensory Module (Acoustic)", scoreDrop: 30, explanation: "Without acoustic data, the creature cannot anticipate fast predators." }
      ],
      summary: "Rhythm module is the primary survival driver. The acoustic sensors are the secondary priority."
    };
  }
};
