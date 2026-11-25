/**
 * Shuffles listings while preventing similar ads (same category or subcategory)
 * from being placed next to each other.
 */
function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCategoryKey(item) {
  return (item.category || 'Other').toLowerCase();
}

function getSubcategoryKey(item) {
  if (Array.isArray(item.tags) && item.tags.length > 1 && item.tags[1]) {
    return String(item.tags[1]).toLowerCase();
  }
  if (Array.isArray(item.tags) && item.tags.length > 0 && item.tags[0]) {
    return String(item.tags[0]).toLowerCase();
  }
  return (item.title || '').trim().toLowerCase().split(/\s+/)[0] || 'general';
}

function shuffleDiverse(items) {
  if (!Array.isArray(items) || items.length <= 1) return items ? [...items] : [];

  // Group into category -> subcategory -> shuffled items
  const catMap = new Map();
  for (const item of items) {
    const cat = getCategoryKey(item);
    const sub = getSubcategoryKey(item);
    if (!catMap.has(cat)) {
      catMap.set(cat, { total: 0, subs: new Map() });
    }
    const catEntry = catMap.get(cat);
    if (!catEntry.subs.has(sub)) {
      catEntry.subs.set(sub, []);
    }
    catEntry.subs.get(sub).push(item);
    catEntry.total += 1;
  }

  for (const catEntry of catMap.values()) {
    for (const list of catEntry.subs.values()) {
      fisherYates(list);
    }
  }

  const result = [];
  const recentCats = [];
  const lastSubByCat = new Map();
  let lastSubOverall = null;

  while (result.length < items.length) {
    const activeCats = [];
    for (const [cat, entry] of catMap.entries()) {
      if (entry.total > 0) activeCats.push([cat, entry]);
    }
    if (activeCats.length === 0) break;

    const windowSize = Math.min(3, Math.max(0, activeCats.length - 1));
    const blockedCats = new Set(recentCats.slice(-windowSize));
    let candidateCats = activeCats.filter(([cat]) => !blockedCats.has(cat));
    if (candidateCats.length === 0) {
      const lastCat = recentCats[recentCats.length - 1];
      candidateCats = activeCats.filter(([cat]) => cat !== lastCat);
      if (candidateCats.length === 0) candidateCats = activeCats;
    }

    // Pick among top remaining-count categories with random tie-breaking
    candidateCats.sort((a, b) => b[1].total - a[1].total);
    const maxCatTotal = candidateCats[0][1].total;
    const topCats = candidateCats.filter(([, entry]) => entry.total >= maxCatTotal - 1);
    const [chosenCat, chosenEntry] = topCats[Math.floor(Math.random() * topCats.length)];

    // Pick a subcategory within chosenCat different from its last used subcategory (and lastSubOverall)
    const activeSubs = [];
    for (const [sub, list] of chosenEntry.subs.entries()) {
      if (list.length > 0) activeSubs.push([sub, list]);
    }
    const lastCatSub = lastSubByCat.get(chosenCat);
    let candidateSubs = activeSubs.filter(([sub]) => sub !== lastCatSub && sub !== lastSubOverall);
    if (candidateSubs.length === 0) {
      candidateSubs = activeSubs.filter(([sub]) => sub !== lastCatSub);
    }
    if (candidateSubs.length === 0) candidateSubs = activeSubs;

    candidateSubs.sort((a, b) => b[1].length - a[1].length);
    const maxSubLen = candidateSubs[0][1].length;
    const topSubs = candidateSubs.filter(([, list]) => list.length >= maxSubLen - 1);
    const [chosenSub, chosenList] = topSubs[Math.floor(Math.random() * topSubs.length)];

    const picked = chosenList.pop();
    chosenEntry.total -= 1;
    result.push(picked);

    recentCats.push(chosenCat);
    lastSubByCat.set(chosenCat, chosenSub);
    lastSubOverall = chosenSub;
  }

  return result;
}

module.exports = { shuffleDiverse };
