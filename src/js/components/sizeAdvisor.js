import { SIZES, BODY_CHART } from '../data/products.js';

/** Height + chest (or weight) + preferred fit → recommended size with a short reason. */
export function recommendSize({ height, chest, weight, fit = 'regular' }) {
  height = +height; chest = +chest; weight = +weight;
  if (!height) return null;
  const nearest = (arr, v) => arr.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(arr[best] - v) ? i : best), 0);
  let iH = nearest(BODY_CHART.height, height);
  let iC = chest ? nearest(BODY_CHART.chest, chest) : weight ? nearest([58, 66, 74, 83, 93, 104], weight) : iH;
  let i = Math.round(iH * 0.4 + iC * 0.6);
  if (fit === 'slim') i -= 1;
  if (fit === 'max') i += 1;
  i = Math.max(0, Math.min(SIZES.length - 1, i));
  const reason = fit === 'slim' ? 'a cleaner, closer line' : fit === 'max' ? 'maximum volume over thick layers' : 'the intended oversized fit over a hoodie';
  return { size: SIZES[i], index: i, reason };
}
