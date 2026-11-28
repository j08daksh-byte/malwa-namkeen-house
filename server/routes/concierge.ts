import { Router } from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { MongoRateLimitStore } from '../lib/mongoRateLimitStore.ts';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const PLACEHOLDER_KEYS = new Set(['', 'your-gemini-api-key', 'placeholder', 'changeme']);
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const FALLBACK_GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

let cachedKey = '';
let aiClient: GoogleGenAI | null = null;

/** Resolves active Gemini API configuration and treats placeholder strings as unconfigured. */
export function getGeminiConfig(): { apiKey: string; model: string; configured: boolean } {
  const rawKey = (process.env.GEMINI_API_KEY || '').trim();
  const configured = Boolean(rawKey && !PLACEHOLDER_KEYS.has(rawKey.toLowerCase()));
  const model = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;
  return { apiKey: configured ? rawKey : '', model, configured };
}

function getGemini(): { client: GoogleGenAI; model: string } {
  const { apiKey, model, configured } = getGeminiConfig();
  if (!configured) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!aiClient || cachedKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    cachedKey = apiKey;
  }
  return { client: aiClient, model };
}

const INITIAL_CONCIERGE_PROMPT = `
You are Malwa Concierge, the warm, polite, and knowledgeable culinary guide at MALWA NAMKEEN HOUSE (EST. 1954).
Your tone is welcoming, respectful, and warm (refer to customers respectfully, greet with 'Namaste' or 'Pranam', and embody authentic Indian hospitality).

Key Business Knowledge & Guidelines:
1. Brand Truth: MALWA NAMKEEN HOUSE was established in 1954, bringing over seven decades of authentic Malwa culinary heritage.
2. Authentic Product Catalog: Artisanal small-batch namkeens including authentic Ratlami Sev (infused with clove and black pepper warmth), Ujjaini Sev, Laung Sev, Hing Peda Sev, Khatta Meetha Mixture, Khasta Mathri, and festive gift hampers.
3. Pure Ingredients: Prepared strictly in 100% Pure Cold-Pressed Groundnut Oil — zero palm oil, zero trans fats, and zero artificial preservatives.
4. Advisory Pricing & Cart: Product prices and weights are dynamically managed on the storefront and checkout. Always advise customers to check the active product cards for current pricing; never invent prices or override checkout data.
5. Shipping & Delivery: Nationwide delivery across India with free shipping on orders above ₹499 (standard delivery is ₹49).
6. Bulk & Corporate Gifting: Custom corporate hampers, wedding boxes, festival gifting, and wholesale namkeen orders. Advise customers to submit an online Bulk & Gifting enquiry or reach out on WhatsApp at +91 7987732765.
7. Constraints: Never invent unverified ingredients, nutrition claims, medical claims, or stock promises. Never refer to table reservations or restaurant dine-in.
`;

export const conciergeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { default: false },
  store: new MongoRateLimitStore('concierge:chat', 5 * 60 * 1000),
  message: {
    success: false,
    message: 'Too many requests to the concierge. Please wait a moment.',
  },
});

function buildKeywordFallback(message: string): string {
  const lower = message.toLowerCase();
  if (/menu|eat|food|namkeen|sev|chivda|wafers|papdi|snack/.test(lower)) {
    return 'Namaste Ji! Our authentic collection spans Sev, Mixture, Fariyali snacks, and Munchies / Snacks — including Ratlami Laung Sev, Ujjaini Hing Sev, and Indore Khatta Meetha Mixture, all handcrafted in 100% pure cold-pressed groundnut oil.';
  }
  if (/gift|hamper|bulk|wedding|corporate|order|buy|shop|ship|deliver/.test(lower)) {
    return 'Pranam Ji! You can explore and order all our authentic namkeens directly in The Shop (free shipping above ₹499), or send us a Bulk & Gifting enquiry or message us on WhatsApp at +91 7987732765.';
  }
  if (/sweet|fariyali|fast|upvas|sabudana|aloo/.test(lower)) {
    return 'Namaste Ji! For fasting & festive cravings, try our crisp Sabudana Fariyali Mixture and Aloo Fariyali Chivda varieties, freshly packed for pan-India delivery.';
  }
  if (/hello|hi|namaste|pranam/.test(lower)) {
    return 'Namaste Ji! Pranam! I am Malwa Concierge, your culinary guide at MALWA NAMKEEN HOUSE. How may I serve Aap today?';
  }
  return 'Namaste Ji! I would be delighted to guide you through our authentic Malwa namkeens & snacks. What would Aap like to know?';
}

router.get('/status', (_req: Request, res: Response) => {
  const { configured, model } = getGeminiConfig();
  res.json({ success: true, configured, model });
});

router.post('/', conciergeLimiter, async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { messages } = body as { messages?: unknown };
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, error: 'Messages array is required.' });
      return;
    }

    // Enforce limits on history payload
    if (messages.length > 50) {
      res.status(400).json({ success: false, error: 'Conversation history too long. Please start a new session.' });
      return;
    }

    for (const m of messages) {
      if (!m || typeof m !== 'object' || typeof (m as any).text !== 'string' || (m as any).text.length > 1000) {
        res.status(400).json({ success: false, error: 'Each message must be an object with text under 1000 characters.' });
        return;
      }
    }

    const rawLast = (messages[messages.length - 1] as { text?: string } | undefined)?.text ?? '';
    const lastUserMessage = String(rawLast).trim().slice(0, 500);
    if (!lastUserMessage) {
      res.status(400).json({ success: false, error: 'Latest user message text is required.' });
      return;
    }

    const { configured } = getGeminiConfig();
    if (!configured) {
      res.json({ text: buildKeywordFallback(lastUserMessage) });
      return;
    }

    const conversationHistoryString = messages
      .slice(Math.max(0, messages.length - 7), messages.length - 1)
      .map((m: { sender?: string; text: string }) => `${m.sender === 'user' ? 'Customer' : 'Malwa Concierge'}: ${m.text}`)
      .join('\n');

    const fullPrompt = `Conversation history:\n${conversationHistoryString}\n\nThe guest asks: "${lastUserMessage}"\nResponse:`;

    try {
      const { client, model } = getGemini();
      const modelsToTry = [model, ...FALLBACK_GEMINI_MODELS.filter(m => m !== model)];
      let responseText: string | undefined;
      let lastAiErr: unknown = null;

      for (const candidateModel of modelsToTry) {
        try {
          const response = await client.models.generateContent({
            model: candidateModel,
            contents: fullPrompt,
            config: {
              systemInstruction: INITIAL_CONCIERGE_PROMPT,
              temperature: 0.8,
              topP: 0.9,
            },
          });
          responseText = response.text;
          break;
        } catch (modelErr: unknown) {
          lastAiErr = modelErr;
          const status = (modelErr as { status?: number })?.status;
          // Retry next flash model only on transient capacity/not-found errors, never on invalid API key (401/403)
          if (status === 401 || status === 403) break;
        }
      }

      if (responseText === undefined) {
        throw lastAiErr || new Error('All Gemini models failed.');
      }

      res.json({ text: responseText ?? 'Namaste Ji. How can I help you today?' });
    } catch (aiErr: unknown) {
      console.warn('[Concierge AI Fallback]:', aiErr instanceof Error ? aiErr.message : aiErr);
      res.json({ text: buildKeywordFallback(lastUserMessage) });
    }
  } catch (err: unknown) {
    console.error('[Concierge] Error:', err instanceof Error ? err.message : err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

export default router;
