/**
 * EZ Swap — Lightweight AI Recommendation Engine (T17 / F-19)
 * 
 * Provides hybrid content-based recommendation logic using:
 *  1. Student viewing history and saved bookmarks
 *  2. Natural language keyword and tag tokenization with stop-word filtering
 *  3. Multi-factor cosine / Jaccard similarity scoring (Category, Tags, Price, Seller Rating)
 *  4. Human-readable AI reasoning generation
 *  5. Optional Gemini 1.5 Flash API integration with automatic fallback
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves', 'utm', 'condition', 'used',
  'good', 'new', 'item', 'sale', 'selling'
]);

/**
 * Tokenize a text string into normalized, meaningful keyword stems/tokens
 * @param {string} text
 * @returns {Set<string>}
 */
function extractTokens(text) {
  if (!text || typeof text !== 'string') return new Set();
  
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  
  return new Set(tokens);
}

/**
 * Calculate Jaccard similarity between two token sets: |A ∩ B| / |A ∪ B|
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number} 0.0 to 1.0
 */
function calculateJaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  
  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }
  
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Calculate price similarity score between target and candidate
 * Uses an exponential decay based on price difference
 * @param {number} priceA
 * @param {number} priceB
 * @returns {number} 0.0 to 1.0
 */
function calculatePriceSimilarity(priceA, priceB) {
  const pA = Number(priceA) || 0;
  const pB = Number(priceB) || 0;
  if (pA === 0 && pB === 0) return 1.0;
  
  const diff = Math.abs(pA - pB);
  const maxPrice = Math.max(pA, pB, 50);
  return Math.max(0, 1 - diff / maxPrice);
}

/**
 * Score a candidate listing against a target reference listing or profile
 * Weights:
 * - Category Match: 35%
 * - Keyword/Tag Token Similarity: 35%
 * - Price Proximity: 15%
 * - Seller Reputation: 10%
 * - Listing Recency: 5%
 * 
 * @param {Object} candidate - Listing object to evaluate
 * @param {Object} reference - Reference item or user aggregated interest profile
 * @returns {{ score: number, reason: string }}
 */
function scoreCandidate(candidate, reference) {
  const candidateTokens = extractTokens(
    `${candidate.title || ''} ${candidate.description || ''} ${(candidate.tags || []).join(' ')}`
  );
  
  const refTokens = reference.tokens || extractTokens(
    `${reference.title || ''} ${reference.description || ''} ${(reference.tags || []).join(' ')}`
  );

  // 1. Category similarity
  const isCategoryMatch = candidate.category === reference.category;
  const categoryScore = isCategoryMatch ? 1.0 : 0.0;

  // 2. Keyword & tag similarity
  const tagScore = calculateJaccardSimilarity(candidateTokens, refTokens);

  // 3. Price proximity
  const priceScore = calculatePriceSimilarity(candidate.price, reference.price || reference.avgPrice || 30);

  // 4. Seller reputation boost
  const sellerRating = candidate.sellerId?.averageRating || 5.0;
  const sellerScore = Math.min(sellerRating / 5.0, 1.0);

  // 5. Recency boost (items created in the last 7 days get full bonus)
  const daysOld = candidate.createdAt
    ? (Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 10;
  const recencyScore = Math.max(0, 1 - daysOld / 30);

  // Weighted composite score (0 to 100)
  const compositeScore =
    categoryScore * 0.35 +
    tagScore * 0.35 +
    priceScore * 0.15 +
    sellerScore * 0.10 +
    recencyScore * 0.05;

  // Generate dynamic explanation reason
  let reason = 'Popular campus deal';
  if (isCategoryMatch && tagScore > 0.2) {
    reason = `Matches your interest in ${candidate.category} & related topics`;
  } else if (isCategoryMatch) {
    reason = `Similar category: ${candidate.category}`;
  } else if (tagScore > 0.25) {
    reason = `Relevant to your recent searches and views`;
  } else if (candidate.sellerId?.verificationStatus === 'verified' && sellerRating >= 4.8) {
    reason = `Top rated student seller (${sellerRating.toFixed(1)}★)`;
  } else if (priceScore > 0.8) {
    reason = `Great value within your recent budget range (RM ${candidate.price})`;
  }

  return {
    score: Math.round(compositeScore * 100),
    reason,
  };
}

/**
 * Build aggregated user interest profile from an array of viewed/bookmarked listings
 * @param {Array<Object>} historyListings
 * @returns {Object}
 */
function buildUserProfile(historyListings) {
  if (!historyListings || historyListings.length === 0) {
    return null;
  }

  const categoryCounts = {};
  let totalPrice = 0;
  const allTokens = new Set();

  historyListings.forEach((item) => {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
    if (typeof item.price === 'number') {
      totalPrice += item.price;
    }
    const tokens = extractTokens(`${item.title || ''} ${item.description || ''} ${(item.tags || []).join(' ')}`);
    tokens.forEach((t) => allTokens.add(t));
  });

  // Find top category
  let topCategory = null;
  let maxCatCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCatCount) {
      maxCatCount = count;
      topCategory = cat;
    }
  }

  return {
    category: topCategory,
    avgPrice: Math.round(totalPrice / historyListings.length),
    tokens: allTokens,
    totalInteractions: historyListings.length,
    recentItemTitle: historyListings[0]?.title || '',
  };
}

/**
 * Optional Gemini AI Re-ranking / Reasoning generator
 * Calls Gemini Flash API if GEMINI_API_KEY is available
 * Gracefully degrades if unavailable.
 */
async function callGeminiForInsights(userProfile, candidateList) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey || !candidateList.length) return null;

  try {
    const prompt = `You are the AI recommendation engine for EZ Swap, a UTM university campus marketplace.
A student recently viewed: "${userProfile.recentItemTitle}" (Category: ${userProfile.category}, Avg Price: RM ${userProfile.avgPrice}).
Here are candidate listings:
${candidateList.slice(0, 5).map((c, i) => `${i + 1}. [${c.category}] ${c.title} (RM ${c.price})`).join('\n')}

For each candidate, provide a 1-sentence friendly student recommendation reason why they would love this.
Output JSON format only:
[{"title": "...", "reason": "..."}]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s maximum timeout

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) return null;

    return JSON.parse(responseText);
  } catch (err) {
    // Non-blocking fallback
    return null;
  }
}

module.exports = {
  extractTokens,
  calculateJaccardSimilarity,
  calculatePriceSimilarity,
  scoreCandidate,
  buildUserProfile,
  callGeminiForInsights,
};
