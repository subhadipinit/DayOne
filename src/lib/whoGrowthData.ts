// Official WHO Child Growth Standards for Girls and Boys (0 to 24 Months)
// Source: World Health Organization (WHO) Multicentre Growth Reference Study

export interface WHOGrowthPoint {
  month: number;
  p3: number;
  p15: number;
  p50: number; // Median
  p85: number;
  p97: number;
}

// ================= GIRLS STANDARDS =================

// Girls Weight-for-Age (kg)
export const WHO_GIRLS_WEIGHT: WHOGrowthPoint[] = [
  { month: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { month: 1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.4 },
  { month: 2, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.9, p97: 6.6 },
  { month: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.7, p97: 7.5 },
  { month: 4, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { month: 5, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { month: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.3, p97: 9.3 },
  { month: 7, p3: 6.0, p15: 6.8, p50: 7.6, p85: 8.7, p97: 9.8 },
  { month: 8, p3: 6.3, p15: 7.0, p50: 7.9, p85: 9.0, p97: 10.2 },
  { month: 9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.5 },
  { month: 10, p3: 6.7, p15: 7.5, p50: 8.5, p85: 9.6, p97: 10.9 },
  { month: 11, p3: 6.9, p15: 7.7, p50: 8.7, p85: 9.9, p97: 11.2 },
  { month: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.2, p97: 11.5 },
  { month: 15, p3: 7.6, p15: 8.5, p50: 9.6, p85: 11.0, p97: 12.4 },
  { month: 18, p3: 8.1, p15: 9.1, p50: 10.2, p85: 11.7, p97: 13.2 },
  { month: 21, p3: 8.6, p15: 9.7, p50: 10.9, p85: 12.5, p97: 14.1 },
  { month: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.2, p97: 14.8 },
];

// Girls Length/Height-for-Age (cm)
export const WHO_GIRLS_LENGTH: WHOGrowthPoint[] = [
  { month: 0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  { month: 1, p3: 49.8, p15: 51.7, p50: 53.7, p85: 55.6, p97: 57.6 },
  { month: 2, p3: 53.0, p15: 55.0, p50: 57.1, p85: 59.1, p97: 61.1 },
  { month: 3, p3: 55.6, p15: 57.7, p50: 59.8, p85: 61.9, p97: 64.0 },
  { month: 4, p3: 57.8, p15: 60.0, p50: 62.1, p85: 64.3, p97: 66.4 },
  { month: 5, p3: 59.6, p15: 61.8, p50: 64.0, p85: 66.2, p97: 68.5 },
  { month: 6, p3: 61.2, p15: 63.5, p50: 65.7, p85: 68.0, p97: 70.3 },
  { month: 7, p3: 62.7, p15: 65.0, p50: 67.3, p85: 69.6, p97: 71.9 },
  { month: 8, p3: 64.0, p15: 66.4, p50: 68.7, p85: 71.1, p97: 73.5 },
  { month: 9, p3: 65.3, p15: 67.7, p50: 70.1, p85: 72.6, p97: 75.0 },
  { month: 10, p3: 66.5, p15: 69.0, p50: 71.5, p85: 73.9, p97: 76.4 },
  { month: 11, p3: 67.7, p15: 70.3, p50: 72.8, p85: 75.3, p97: 77.8 },
  { month: 12, p3: 68.9, p15: 71.4, p50: 74.0, p85: 76.6, p97: 79.2 },
  { month: 15, p3: 72.0, p15: 74.8, p50: 77.5, p85: 80.2, p97: 83.0 },
  { month: 18, p3: 74.9, p15: 77.8, p50: 80.7, p85: 83.6, p97: 86.5 },
  { month: 21, p3: 77.5, p15: 80.6, p50: 83.7, p85: 86.7, p97: 89.8 },
  { month: 24, p3: 80.0, p15: 83.2, p50: 86.4, p85: 89.6, p97: 92.9 },
];

// Girls Head Circumference-for-Age (cm)
export const WHO_GIRLS_HEAD: WHOGrowthPoint[] = [
  { month: 0, p3: 31.5, p15: 32.7, p50: 33.9, p85: 35.1, p97: 36.2 },
  { month: 1, p3: 34.2, p15: 35.4, p50: 36.5, p85: 37.7, p97: 38.9 },
  { month: 2, p3: 35.8, p15: 37.0, p50: 38.3, p85: 39.5, p97: 40.7 },
  { month: 3, p3: 37.1, p15: 38.3, p50: 39.5, p85: 40.8, p97: 42.0 },
  { month: 4, p3: 38.1, p15: 39.3, p50: 40.6, p85: 41.9, p97: 43.1 },
  { month: 5, p3: 39.0, p15: 40.2, p50: 41.5, p85: 42.8, p97: 44.0 },
  { month: 6, p3: 39.7, p15: 41.0, p50: 42.2, p85: 43.5, p97: 44.8 },
  { month: 7, p3: 40.4, p15: 41.6, p50: 42.8, p85: 44.2, p97: 45.5 },
  { month: 8, p3: 40.9, p15: 42.1, p50: 43.4, p85: 44.8, p97: 46.1 },
  { month: 9, p3: 41.3, p15: 42.6, p50: 43.8, p85: 45.3, p97: 46.6 },
  { month: 10, p3: 41.7, p15: 43.0, p50: 44.2, p85: 45.7, p97: 47.1 },
  { month: 11, p3: 42.0, p15: 43.3, p50: 44.6, p85: 46.1, p97: 47.5 },
  { month: 12, p3: 42.3, p15: 43.6, p50: 44.9, p85: 46.4, p97: 47.8 },
  { month: 15, p3: 43.1, p15: 44.4, p50: 45.7, p85: 47.3, p97: 48.7 },
  { month: 18, p3: 43.7, p15: 45.0, p50: 46.4, p85: 48.0, p97: 49.4 },
  { month: 21, p3: 44.2, p15: 45.6, p50: 47.0, p85: 48.6, p97: 50.1 },
  { month: 24, p3: 44.7, p15: 46.1, p50: 47.5, p85: 49.1, p97: 50.6 },
];

// ================= BOYS STANDARDS =================

// Boys Weight-for-Age (kg)
export const WHO_BOYS_WEIGHT: WHOGrowthPoint[] = [
  { month: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { month: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { month: 2, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { month: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { month: 4, p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.7 },
  { month: 5, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { month: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { month: 7, p3: 6.7, p15: 7.4, p50: 8.3, p85: 9.2, p97: 10.3 },
  { month: 8, p3: 6.9, p15: 7.7, p50: 8.6, p85: 9.6, p97: 10.7 },
  { month: 9, p3: 7.1, p15: 8.0, p50: 8.9, p85: 9.9, p97: 11.0 },
  { month: 10, p3: 7.4, p15: 8.2, p50: 9.2, p85: 10.2, p97: 11.4 },
  { month: 11, p3: 7.6, p15: 8.4, p50: 9.4, p85: 10.5, p97: 11.7 },
  { month: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 12.0 },
  { month: 15, p3: 8.3, p15: 9.3, p50: 10.3, p85: 11.5, p97: 12.8 },
  { month: 18, p3: 8.8, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.7 },
  { month: 21, p3: 9.2, p15: 10.3, p50: 11.5, p85: 12.9, p97: 14.5 },
  { month: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.3 },
];

// Boys Length/Height-for-Age (cm)
export const WHO_BOYS_LENGTH: WHOGrowthPoint[] = [
  { month: 0, p3: 46.1, p15: 48.0, p50: 49.9, p85: 51.8, p97: 53.7 },
  { month: 1, p3: 50.8, p15: 52.8, p50: 54.7, p85: 56.7, p97: 58.6 },
  { month: 2, p3: 54.4, p15: 56.4, p50: 58.4, p85: 60.4, p97: 62.4 },
  { month: 3, p3: 57.3, p15: 59.4, p50: 61.4, p85: 63.5, p97: 65.5 },
  { month: 4, p3: 59.7, p15: 61.8, p50: 63.9, p85: 66.0, p97: 68.0 },
  { month: 5, p3: 61.7, p15: 63.8, p50: 65.9, p85: 68.0, p97: 70.1 },
  { month: 6, p3: 63.3, p15: 65.5, p50: 67.6, p85: 69.8, p97: 71.9 },
  { month: 7, p3: 64.8, p15: 67.0, p50: 69.2, p85: 71.3, p97: 73.5 },
  { month: 8, p3: 66.2, p15: 68.4, p50: 70.6, p85: 72.8, p97: 75.0 },
  { month: 9, p3: 67.5, p15: 69.7, p50: 72.0, p85: 74.2, p97: 76.5 },
  { month: 10, p3: 68.7, p15: 71.0, p50: 73.3, p85: 75.6, p97: 77.9 },
  { month: 11, p3: 69.9, p15: 72.2, p50: 74.5, p85: 76.9, p97: 79.2 },
  { month: 12, p3: 71.0, p15: 73.4, p50: 75.7, p85: 78.1, p97: 80.5 },
  { month: 15, p3: 74.1, p15: 76.6, p50: 79.1, p85: 81.7, p97: 84.2 },
  { month: 18, p3: 76.9, p15: 79.6, p50: 82.3, p85: 85.0, p97: 87.7 },
  { month: 21, p3: 79.4, p15: 82.3, p50: 85.1, p85: 88.0, p97: 90.9 },
  { month: 24, p3: 81.7, p15: 84.8, p50: 87.8, p85: 90.9, p97: 93.9 },
];

// Boys Head Circumference-for-Age (cm)
export const WHO_BOYS_HEAD: WHOGrowthPoint[] = [
  { month: 0, p3: 31.9, p15: 33.2, p50: 34.5, p85: 35.7, p97: 37.0 },
  { month: 1, p3: 34.9, p15: 36.1, p50: 37.3, p85: 38.6, p97: 39.8 },
  { month: 2, p3: 36.8, p15: 38.0, p50: 39.3, p85: 40.5, p97: 41.8 },
  { month: 3, p3: 38.1, p15: 39.4, p50: 40.5, p85: 41.8, p97: 43.1 },
  { month: 4, p3: 39.2, p15: 40.5, p50: 41.6, p85: 42.9, p97: 44.2 },
  { month: 5, p3: 40.1, p15: 41.4, p50: 42.6, p85: 43.8, p97: 45.1 },
  { month: 6, p3: 40.9, p15: 42.2, p50: 43.3, p85: 44.6, p97: 45.9 },
  { month: 7, p3: 41.5, p15: 42.8, p50: 44.0, p85: 45.3, p97: 46.5 },
  { month: 8, p3: 42.0, p15: 43.3, p50: 44.5, p85: 45.8, p97: 47.1 },
  { month: 9, p3: 42.5, p15: 43.8, p50: 45.0, p85: 46.3, p97: 47.6 },
  { month: 10, p3: 42.9, p15: 44.2, p50: 45.4, p85: 46.7, p97: 48.0 },
  { month: 11, p3: 43.2, p15: 44.5, p50: 45.8, p85: 47.1, p97: 48.4 },
  { month: 12, p3: 43.5, p15: 44.9, p50: 46.1, p85: 47.4, p97: 48.7 },
  { month: 15, p3: 44.3, p15: 45.7, p50: 47.0, p85: 48.3, p97: 49.7 },
  { month: 18, p3: 44.9, p15: 46.3, p50: 47.6, p85: 49.0, p97: 50.4 },
  { month: 21, p3: 45.4, p15: 46.8, p50: 48.2, p85: 49.6, p97: 51.0 },
  { month: 24, p3: 45.9, p15: 47.3, p50: 48.7, p85: 50.1, p97: 51.5 },
];

/**
 * Returns the official WHO growth dataset for a given metric and gender.
 */
export function getWHOGrowthData(
  metric: 'weight' | 'length' | 'head',
  gender: 'female' | 'male' = 'female'
): WHOGrowthPoint[] {
  if (gender === 'male') {
    if (metric === 'weight') return WHO_BOYS_WEIGHT;
    if (metric === 'length') return WHO_BOYS_LENGTH;
    return WHO_BOYS_HEAD;
  }
  // Default: Female
  if (metric === 'weight') return WHO_GIRLS_WEIGHT;
  if (metric === 'length') return WHO_GIRLS_LENGTH;
  return WHO_GIRLS_HEAD;
}

export function getWhoGrowthPoints(
  gender: 'female' | 'male' | undefined,
  metric: 'weight' | 'length' | 'head'
): WHOGrowthPoint[] {
  return getWHOGrowthData(metric, gender || 'female');
}

/**
 * Calculates the approximate percentile category for a given measurement
 */
export function getPercentileCategory(val: number, points: WHOGrowthPoint[], month: number): string {
  const roundedMonth = Math.min(24, Math.max(0, Math.round(month)));
  const pt = points.find(p => p.month === roundedMonth) || points[points.length - 1];

  if (val < pt.p3) return '< 3rd percentile (Below average)';
  if (val < pt.p15) return '3rd - 15th percentile (Mildly low)';
  if (val <= pt.p85) return '15th - 85th percentile (Normal healthy range)';
  if (val <= pt.p97) return '85th - 97th percentile (Above average)';
  return '> 97th percentile (High)';
}
