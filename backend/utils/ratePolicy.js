/**
 * Central place to define allowed worker hourly rates (INR) per service category.
 * You can tune these numbers anytime without touching controllers/UI.
 */
const DEFAULT_BOUNDS = { min: 250, max: 1200 };

const CATEGORY_BOUNDS = {
  Electrician: { min: 300, max: 1000 },
  Plumbing: { min: 300, max: 1000 },
  Painting: { min: 250, max: 900 },
  Carpenter: { min: 300, max: 1000 }
};

function getRateBounds(category) {
  if (category && CATEGORY_BOUNDS[category]) return CATEGORY_BOUNDS[category];
  return DEFAULT_BOUNDS;
}

/**
 * "Extreme ends" threshold. If a chosen price is within this fraction
 * of the allowed min/max, we can warn the worker (still allowed).
 */
const EXTREME_FRACTION = 0.08; // 8%

function getExtremeFlags(price, bounds) {
  const p = Number(price);
  const { min, max } = bounds;
  if (!Number.isFinite(p)) return { isLowExtreme: false, isHighExtreme: false };
  const span = Math.max(1, max - min);
  const isLowExtreme = p <= min + span * EXTREME_FRACTION;
  const isHighExtreme = p >= max - span * EXTREME_FRACTION;
  return { isLowExtreme, isHighExtreme };
}

module.exports = { getRateBounds, getExtremeFlags, DEFAULT_BOUNDS, CATEGORY_BOUNDS };
