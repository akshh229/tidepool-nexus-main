# Tidepool Brain — 30-Trial Simulation Results

**Date:** 2026-03-15 05:30:08
**Trials:** 30  |  **Steps per trial:** 20,000
**Neurons:** 134  |  **Connections:** 330

## Aggregate Scores (mean across 30 trials)

| Metric | Score |
|--------|-------|
| Survival Rate | 63.94% |
| Foraging Accuracy | 0.00% |
| Adaptation Score | 0.1010 |
| Predator Avoidance | 100.00% |
| Shelter Timing | 1.11% |
| Navigation Efficiency | 100.00% |
| Activity Efficiency | 0.0000 |
| Avg Activity Cost | 53.8808 |

## Weighted Score Breakdown (out of 50)

| Category | Weight | Raw | Pts |
|----------|--------|-----|-----|
| survivalFraction | 10 | 0.6394 | 6.39 |
| foragingAccuracy | 10 | 0.0000 | 0.00 |
| adaptationScore | 5 | 0.1010 | 0.50 |
| predatorAvoidance | 10 | 1.0000 | 10.00 |
| shelterTiming | 5 | 0.0111 | 0.06 |
| navigationEfficiency | 5 | 1.0000 | 5.00 |
| activityEfficiency | 5 | 0.0000 | 0.00 |
| **TOTAL** | **50** | | **21.95** |

## Per-Trial Breakdown

| Trial | Survival | Foraging | Predator Avoid | Shelter | Activity Eff | Correct Eats | Toxic Eats | Predator Hits |
|-------|----------|----------|----------------|---------|-------------|-------------|-----------|---------------|
|  1 | 94.27% | 0.00% | 100.00% | 2.75% | 0.0000 | 0 | 0 | 0 |
|  2 | 3.98% | 0.00% | 100.00% | 1.07% | 0.0000 | 0 | 0 | 0 |
|  3 | 10.16% | 0.00% | 100.00% | 1.78% | 0.0000 | 0 | 0 | 0 |
|  4 | 68.70% | 0.00% | 100.00% | 0.19% | 0.0000 | 0 | 0 | 0 |
|  5 | 90.44% | 0.00% | 100.00% | 0.07% | 0.0000 | 0 | 0 | 0 |
|  6 | 92.05% | 0.00% | 100.00% | 4.41% | 0.0000 | 0 | 0 | 0 |
|  7 | 84.73% | 0.00% | 100.00% | 1.68% | 0.0000 | 0 | 0 | 0 |
|  8 | 91.94% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
|  9 | 99.91% | 0.00% | 100.00% | 2.16% | 0.0000 | 0 | 0 | 0 |
| 10 | 11.49% | 0.00% | 100.00% | 1.45% | 0.0000 | 0 | 0 | 0 |
| 11 | 85.93% | 0.00% | 100.00% | 0.94% | 0.0000 | 0 | 0 | 0 |
| 12 | 90.96% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 13 | 99.76% | 0.00% | 100.00% | 0.47% | 0.0000 | 0 | 0 | 0 |
| 14 | 94.91% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 15 | 14.84% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 16 | 12.22% | 0.00% | 100.00% | 1.13% | 0.0000 | 0 | 0 | 0 |
| 17 | 75.46% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 18 | 99.69% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 19 | 13.01% | 0.00% | 100.00% | 3.67% | 0.0000 | 0 | 0 | 0 |
| 20 | 36.98% | 0.00% | 100.00% | 0.47% | 0.0000 | 0 | 0 | 0 |
| 21 | 86.20% | 0.00% | 100.00% | 0.56% | 0.0000 | 0 | 0 | 0 |
| 22 | 100.00% | 0.00% | 100.00% | 0.07% | 0.0000 | 0 | 0 | 0 |
| 23 | 12.04% | 0.00% | 100.00% | 1.22% | 0.0000 | 0 | 0 | 0 |
| 24 | 96.84% | 0.00% | 100.00% | 0.46% | 0.0000 | 0 | 0 | 0 |
| 25 | 98.20% | 0.00% | 100.00% | 2.01% | 0.0000 | 0 | 0 | 0 |
| 26 | 7.73% | 0.00% | 100.00% | 3.28% | 0.0000 | 0 | 0 | 0 |
| 27 | 16.90% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 28 | 45.41% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |
| 29 | 87.80% | 0.00% | 100.00% | 3.44% | 0.0000 | 0 | 0 | 0 |
| 30 | 95.56% | 0.00% | 100.00% | 0.00% | 0.0000 | 0 | 0 | 0 |

## Key Definitions

- **Survival Rate**: Fraction of steps the creature remained alive (energy > 0)
- **Foraging Accuracy**: (correct eats − toxic eats) / total eats
- **Predator Avoidance**: 1 − (hits / expected random baseline hits)
- **Shelter Timing**: Fraction of night steps spent inside shelter
- **Activity Efficiency**: Functional performance / (avg activity cost × neuron count) — measures sparse coding
- **Adaptation Score**: 1 / ln(mean steps to re-learn after nutrition rotation + e)
