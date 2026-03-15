# 🚀 Updates & Changes After Mid-Submission (Post-March 8th)

This document catalogs the major feature additions, UI/UX revisions, and architectural refactoring deployed since the project's mid-submission checkpoint on March 8th, 2026. The primary focus of this phase was introducing an **AI Assistant Suite** to provide automated analysis of the neural simulations, as well as overhauling the **Authentication/Onboarding flow**.

## 1. 🤖 AI Experiment Coach (Trial Analysis)
* **Feature:** Added an automated system that hooks into the end-of-trial telemetry to diagnose behavioral bottlenecks and survival failures.
* **UI Addition:** Users can now click the **Robot Icon (🤖)** in the top navigation bar (`TopHeaderBar.tsx`) to pull up the `AICoachModal`.
* **Output:** It identifies root causes (e.g., "Sensory mapping delayed under high pressure") and recommends specific numeric parameter tweaks (`chemPulseThreshold`, `predatorFleeThrust`) with an explicit "Confidence Level".

## 2. ✨ Natural Language Scenario Builder
* **Feature:** Migrated away from purely static config buttons towards a dynamic natural language parser.
* **UI Addition:** Accessible via the **Sparkles Icon (✨)** in the header. 
* **Output:** Allows the user to type descriptions like, *"Make a harsh environment with high predator counts and short days,"* and structurally parses this into a JSON configuration bundle applied directly to the simulated world.

## 3. 📈 Strategy Drift Detector
* **Feature:** Implemented a chronological monitoring tool that tracks metrics across multiple generations (epochs). It detects when the neural strategy "drifts" or degrades against changing scenarios (such as failing to reset nutrition mappings).
* **UI Addition:** Added a **Refresh/Activity Icon** overlay on the top right of the central graph dashboard (`CentreMetrics.tsx`). It features dynamic, animated glowing alerts when degrading behaviour is mathematically detected.

## 4. 🔬 Auto-Ablation Analyst
* **Feature:** A sophisticated testing protocol that temporarily turns off explicit modules of the organism's brain (Shelter Timing, Acoustic processing, etc.), scores the survival drops, and logs a graded severity chart.
* **UI Addition:** Overhauled the Ablations panel in the `LeftControlPanel.tsx` by adding a master trigger button. When clicked, it opens `AIAblationModal.tsx` which computes and renders the **Module Dominance Ranking** visually.

## 5. 🌍 Landing Page Overhaul & CSS Mockups
* **Feature:** Built a dedicated `/` landing page (`Landing.tsx`) that greets researchers with project branding and details before diving into `/app`.
* **UI/UX Fix:** Because the placeholder `/public/images/tidepool-brain-ui.png` snapshot was missing, we developed an entirely CSS-based structural mockup animation replicating the dashboard in real-time, eliminating broken image assets.

## 6. 🔐 Zero-Config Local Authentication Refactor
* **Removed Firebase:** Completely decoupled and removed Firebase Authentication, `firebase/auth`, and its associated npm dependencies out of the project.
* **Reasoning:** Storing `.env` credentials proved too brittle for judging environments and instantaneous local testing.
* **Implementation:** Refactored `AuthContext.tsx` to handle authentication entirely inside the browser. Using a **"Local Storage Mock Auth"**, users enter via a "Start Local Session" button. It instantly creates a volatile `Guest Researcher` identity, allowing the dashboard to function seamlessly without requiring database spin-ups, config files, or secret keys.

## 7. Dependencies & Cleanups
* **Icons Added:** Installed `lucide-react` for modal iconology.
* **Cleanup:** Removed dead unused files (like `firebase.ts`) and simplified router paths within `App.tsx` and `main.tsx`.