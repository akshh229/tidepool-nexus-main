# Tidepool Brain — 30-Trial Simulation Results

**Date:** 2026-03-08 12:31:54
**Trials:** 30  |  **Steps per trial:** 20,000
**Neurons:** 134  |  **Connections:** 330

## Aggregate Scores (mean across 30 trials)

| Metric | Score |
|--------|-------|
| Survival Rate | 55.26% |
| Foraging Accuracy | 0.00% |
| Adaptation Score | 0.1010 |
| Predator Avoidance | 100.00% |
| Shelter Timing | 1.48% |
| Navigation Efficiency | 332.80% |
| Activity Efficiency | 0.0000 |
| Avg Activity Cost | 57.3765 |

## Weighted Score Breakdown (out of 50)

| Category | Weight | Raw | Pts |
|----------|--------|-----|-----|
| survivalFraction | 10 | 0.5526 | 5.53 |
| foragingAccuracy | 10 | 0.0000 | 0.00 |
| adaptationScore | 5 | 0.1010 | 0.50 |
| predatorAvoidance | 10 | 1.0000 | 10.00 |
| shelterTiming | 5 | 0.0148 | 0.07 |
| navigationEfficiency | 5 | 1.0000 | 5.00 |
| activityEfficiency | 5 | 0.0000 | 0.00 |
| **TOTAL** | **50** | | **21.10** |

## Per-Trial Breakdown

| Trial | Survival | Foraging | Predator Avoid | Shelter | Activity Eff | Correct Eats | Toxic Eats | Predator Hits |
|-------|----------|----------|----------------|---------|-------------|-------------|-----------|---------------|
|  1 | 98.23% | 0.00% | 100.00% | 1.65% | 0.0000 | 0 | 0 | 0 |
|  2 | 99.44% | 0.00% | 100.00% | 2.36% | 0.0000 | 0 | 0 | 0 |
|  3 | 95.85% | 0.00% | 100.00% | 1.42% | 0.0000 | 0 | 0 | 0 |
|  4 | 98.18% | 0.00% | 100.00% | 1.78% | 0.0000 | 0 | 0 | 0 |
|  5 | 99.30% | 0.00% | 100.00% | 1.80% | 0.0000 | 0 | 0 | 0 |
|  6 | 6.56% | 0.00% | 100.00% | 2.03% | 0.0000 | 0 | 0 | 0 |
|  7 | 5.78% | 0.00% | 100.00% | 2.07% | 0.0000 | 0 | 0 | 0 |
|  8 | 9.79% | 0.00% | 100.00% | 1.33% | 0.0000 | 0 | 0 | 0 |
|  9 | 69.88% | 0.00% | 100.00% | 1.64% | 0.0000 | 0 | 0 | 0 |
| 10 | 96.78% | 0.00% | 100.00% | 1.34% | 0.0000 | 0 | 0 | 0 |
| 11 | 7.20% | 0.00% | 100.00% | 1.17% | 0.0000 | 0 | 0 | 0 |
| 12 | 6.89% | 0.00% | 100.00% | 0.77% | 0.0000 | 0 | 0 | 0 |
| 13 | 18.58% | 0.00% | 100.00% | 1.72% | 0.0000 | 0 | 0 | 0 |
| 14 | 86.77% | 0.00% | 100.00% | 1.72% | 0.0000 | 0 | 0 | 0 |
| 15 | 4.93% | 0.00% | 100.00% | 1.36% | 0.0000 | 0 | 0 | 0 |
| 16 | 6.83% | 0.00% | 100.00% | 0.68% | 0.0000 | 0 | 0 | 0 |
| 17 | 21.32% | 0.00% | 100.00% | 1.33% | 0.0000 | 0 | 0 | 0 |
| 18 | 97.20% | 0.00% | 100.00% | 0.98% | 0.0000 | 0 | 0 | 0 |
| 19 | 96.13% | 0.00% | 100.00% | 1.57% | 0.0000 | 0 | 0 | 0 |
| 20 | 98.47% | 0.00% | 100.00% | 1.26% | 0.0000 | 0 | 0 | 0 |
| 21 | 5.49% | 0.00% | 100.00% | 1.49% | 0.0000 | 0 | 0 | 0 |
| 22 | 4.09% | 0.00% | 100.00% | 1.46% | 0.0000 | 0 | 0 | 0 |
| 23 | 25.70% | 0.00% | 100.00% | 1.38% | 0.0000 | 0 | 0 | 0 |
| 24 | 97.36% | 0.00% | 100.00% | 1.29% | 0.0000 | 0 | 0 | 0 |
| 25 | 97.45% | 0.00% | 100.00% | 1.34% | 0.0000 | 0 | 0 | 0 |
| 26 | 97.70% | 0.00% | 100.00% | 1.52% | 0.0000 | 0 | 0 | 0 |
| 27 | 96.00% | 0.00% | 100.00% | 1.56% | 0.0000 | 0 | 0 | 0 |
| 28 | 96.81% | 0.00% | 100.00% | 1.41% | 0.0000 | 0 | 0 | 0 |
| 29 | 6.12% | 0.00% | 100.00% | 1.90% | 0.0000 | 0 | 0 | 0 |
| 30 | 7.00% | 0.00% | 100.00% | 0.98% | 0.0000 | 0 | 0 | 0 |

## Key Definitions

- **Survival Rate**: Fraction of steps the creature remained alive (energy > 0)
- **Foraging Accuracy**: (correct eats − toxic eats) / total eats
- **Predator Avoidance**: 1 − (hits / expected random baseline hits)
- **Shelter Timing**: Fraction of night steps spent inside shelter
- **Activity Efficiency**: Functional performance / (avg activity cost × neuron count) — measures sparse coding
- **Adaptation Score**: 1 / ln(mean steps to re-learn after nutrition rotation + e)
