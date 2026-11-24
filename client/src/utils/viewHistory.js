/**
 * EZ Swap — Client-side Viewing History & Recommendation Helper (T17)
 */

const STORAGE_KEY = 'ez_swap_view_history';
const MAX_HISTORY = 20;

/**
 * Get list of recently viewed listing IDs from localStorage
 * @returns {string[]}
 */
export function getRecentViewIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record a listing view in localStorage and notify backend API
 * @param {string} listingId 
 * @param {string} [userId] 
 */
export async function recordView(listingId, userId = null) {
  if (!listingId) return;

  try {
    // 1. Update localStorage history
    const existing = getRecentViewIds().filter((id) => id !== listingId);
    const updated = [listingId, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Notify backend view endpoint
    fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {});
  } catch (e) {
    console.warn('Could not record view:', e);
  }
}

/**
 * Clear local viewing history
 */
export function clearViewHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

/**
 * Fetch personalized recommendations from API (with fallback)
 */
export async function fetchPersonalizedRecommendations(userId = null, limit = 6) {
  const recentIds = getRecentViewIds();
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (recentIds.length > 0) params.append('recentIds', recentIds.join(','));
  params.append('limit', limit);

  try {
    const res = await fetch(`/api/listings/recommendations?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('API recommendations fetch failed, falling back to local:', err);
  }

  return null;
}

/**
 * Fetch similar items for a specific listing
 */
export async function fetchSimilarListings(listingId, limit = 4) {
  if (!listingId) return [];

  try {
    const res = await fetch(`/api/listings/${listingId}/similar?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.similar)) {
        return data.similar;
      }
    }
  } catch (err) {
    console.warn('Similar listings fetch failed:', err);
  }

  return [];
}
