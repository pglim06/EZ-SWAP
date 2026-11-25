const VALID_CATEGORIES = ['Textbooks', 'Electronics', 'Dorm', 'Services', 'Clothing', 'Other'];
const VALID_CONDITIONS = ['New', 'Used'];

/**
 * Fetches an image URL and returns { base64, mimeType }.
 */
async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl, {
    headers: { 'User-Agent': 'EZSwap/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch image (${response.status})`);
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();
  if (!mimeType.startsWith('image/')) {
    throw new Error('Provided URL did not return an image');
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    base64: Buffer.from(arrayBuffer).toString('base64'),
    mimeType,
  };
}

/**
 * Analyzes a product image with Gemini 2.5 Flash Vision and returns a structured,
 * buyer-focused product description and inspection checklist.
 */
async function analyzeProductImage({ buffer, mimeType, imageUrl, context = {} }) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  let base64Data;
  let resolvedMimeType = mimeType || 'image/jpeg';

  if (buffer) {
    base64Data = buffer.toString('base64');
  } else if (imageUrl) {
    const fetched = await fetchImageAsBase64(imageUrl);
    base64Data = fetched.base64;
    resolvedMimeType = fetched.mimeType;
  } else {
    throw new Error('An image file or imageUrl is required for analysis.');
  }

  const contextLines = [];
  if (context.title) contextLines.push(`Listing title: "${context.title}"`);
  if (context.category) contextLines.push(`Category: ${context.category}`);
  if (context.condition) contextLines.push(`Declared condition: ${context.condition}`);
  if (context.price !== undefined && context.price !== '') {
    contextLines.push(`Asking price: RM ${context.price}`);
  }

  const prompt = `You are a helpful product specialist for EZ Swap, a UTM university campus marketplace.
Analyze the attached product image carefully and write a clear, honest, buyer-friendly product description so a student buyer immediately understands what the product is, its visible condition, and what to check before buying.
${contextLines.length ? `\nListing context:\n${contextLines.join('\n')}\n` : ''}
Return valid JSON only with these exact keys:
{
  "productSummary": "2-3 concise sentences describing the exact item shown in the photo, its visible features, and who/what it is useful for.",
  "suggestedTitle": "Short, clear product title (max 80 chars)",
  "suggestedCategory": "One of: Textbooks, Electronics, Dorm, Services, Clothing, Other",
  "suggestedCondition": "One of: New, Used",
  "visualCondition": "1 sentence describing visible condition, wear, cleanliness, or packaging seen in the photo.",
  "keyHighlights": ["3 to 4 short bullet points of notable features or details visible in the image"],
  "buyerChecklist": ["2 to 3 practical things the buyer should inspect or ask the seller before paying at campus meetup"]
}`;

  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-3.8-flash',
  ];

  let data = null;
  let lastError = null;

  for (const modelName of modelsToTry) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: resolvedMimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
          signal: controller.signal,
        }
      );

      data = await response.json();
      if (response.ok) {
        lastError = null;
        break;
      }
      lastError = new Error(data.error?.message || `Gemini API error (${response.status})`);
      // Try next fallback model on unavailable/overload/rate-limit responses
      if (![400, 404, 429, 503].includes(response.status)) {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (err.name !== 'AbortError' && !err.message?.includes('Gemini API error')) {
        // Network or abort on this model: try next fallback
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError) {
    throw lastError;
  }

  try {

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('Gemini returned an empty analysis response.');
    }

    const parsed = JSON.parse(rawText);
    return {
      productSummary: String(parsed.productSummary || '').trim(),
      suggestedTitle: String(parsed.suggestedTitle || '').trim().slice(0, 100),
      suggestedCategory: VALID_CATEGORIES.includes(parsed.suggestedCategory)
        ? parsed.suggestedCategory
        : 'Other',
      suggestedCondition: VALID_CONDITIONS.includes(parsed.suggestedCondition)
        ? parsed.suggestedCondition
        : 'Used',
      visualCondition: String(parsed.visualCondition || '').trim(),
      keyHighlights: Array.isArray(parsed.keyHighlights)
        ? parsed.keyHighlights.map((x) => String(x).trim()).filter(Boolean).slice(0, 5)
        : [],
      buyerChecklist: Array.isArray(parsed.buyerChecklist)
        ? parsed.buyerChecklist.map((x) => String(x).trim()).filter(Boolean).slice(0, 4)
        : [],
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  analyzeProductImage,
};
