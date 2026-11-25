const Listing = require('../models/Listing');

const GENERIC_TAGS = new Set([
  'textbooks',
  'electronics',
  'dorm',
  'services',
  'clothing',
  'other',
  'new',
  'used',
]);

function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Linear-interpolation percentile (R-7 / Excel PERCENTILE.INC) on a sorted ascending array.
 */
function calculatePercentile(sortedPrices, p) {
  if (!sortedPrices.length) return 0;
  if (sortedPrices.length === 1) return sortedPrices[0];

  const index = (sortedPrices.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sortedPrices[lower];
  return sortedPrices[lower] * (1 - weight) + sortedPrices[upper] * weight;
}

/**
 * Pure statistical computation for Price Insight from an array of comparable prices.
 */
function computePriceInsightFromPrices(currentPrice, comparablePrices, scopeLabel = '') {
  const numericCurrent = Number(currentPrice) || 0;
  const validPrices = comparablePrices
    .map((p) => Number(p))
    .filter((p) => Number.isFinite(p) && p >= 0)
    .sort((a, b) => a - b);

  if (validPrices.length === 0) {
    validPrices.push(numericCurrent);
  }

  const sampleCount = validPrices.length;
  const minPrice = validPrices[0];
  const maxPrice = validPrices[sampleCount - 1];

  let q1;
  let median;
  let q3;

  if (sampleCount < 4) {
    // Edge case fallback: +-10% around average price when sample size is small
    const avg = validPrices.reduce((sum, p) => sum + p, 0) / sampleCount;
    q1 = roundPrice(avg * 0.9);
    median = roundPrice(avg);
    q3 = roundPrice(avg * 1.1);
  } else {
    q1 = roundPrice(calculatePercentile(validPrices, 0.25));
    median = roundPrice(calculatePercentile(validPrices, 0.5));
    q3 = roundPrice(calculatePercentile(validPrices, 0.75));
  }

  // Ensure a non-zero quartile band when all comparable items share the exact same price
  if (q1 === q3) {
    const base = median || numericCurrent || 10;
    q1 = roundPrice(Math.max(0, base * 0.9));
    q3 = roundPrice(base * 1.1);
  }

  const rawMin = Math.min(minPrice, numericCurrent, q1);
  const rawMax = Math.max(maxPrice, numericCurrent, q3);
  const span = rawMax - rawMin;
  const padding = span > 0 ? span * 0.12 : Math.max(rawMax * 0.15, 5);

  let minAxis = Math.max(0, Math.floor(rawMin - padding));
  let maxAxis = Math.ceil(rawMax + padding);
  if (maxAxis <= minAxis) {
    maxAxis = minAxis + 10;
  }

  let status = 'fair_price';
  if (numericCurrent < q1) {
    status = 'below_market';
  } else if (numericCurrent > q3) {
    status = 'above_market';
  }

  return {
    currentPrice: roundPrice(numericCurrent),
    q1,
    median,
    q3,
    minPrice: roundPrice(minPrice),
    maxPrice: roundPrice(maxPrice),
    minAxis,
    maxAxis,
    sampleCount,
    status,
    scopeLabel,
  };
}

/**
 * Queries comparable listings from MongoDB for a target listing and computes priceInsight.
 * Prefers subcategory/specific tags within the same category; falls back to category-wide
 * listings if fewer than 4 tag-matched items exist.
 */
async function getPriceInsightForListing(targetListing) {
  if (!targetListing) return null;

  const specificTags = Array.isArray(targetListing.tags)
    ? targetListing.tags
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => t && !GENERIC_TAGS.has(t))
    : [];

  let comparableDocs = [];
  let scopeLabel = targetListing.category || 'listings';

  if (specificTags.length > 0) {
    comparableDocs = await Listing.find({
      category: targetListing.category,
      status: { $ne: 'removed' },
      tags: { $in: specificTags },
    })
      .select('price')
      .lean();

    if (comparableDocs.length >= 4) {
      scopeLabel = specificTags[0];
    }
  }

  if (comparableDocs.length < 4) {
    comparableDocs = await Listing.find({
      category: targetListing.category,
      status: { $ne: 'removed' },
    })
      .select('price')
      .lean();
    scopeLabel = targetListing.category || 'listings';
  }

  const prices = comparableDocs.map((doc) => doc.price);
  return computePriceInsightFromPrices(targetListing.price, prices, scopeLabel);
}

module.exports = {
  calculatePercentile,
  computePriceInsightFromPrices,
  getPriceInsightForListing,
};
