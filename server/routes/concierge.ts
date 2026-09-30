import { Router } from 'express';
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
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
  message: {
    success: false,
    message: 'Too many requests to the concierge. Please wait a moment.',
  },
});

router.post('/', conciergeLimiter, async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    // Enforce limits on history payload
    if (messages.length > 50) {
      res.status(400).json({ error: 'Conversation history too long. Please start a new session.' });
      return;
    }

    for (const m of messages) {
      if (typeof m.text !== 'string' || m.text.length > 1000) {
        res.status(400).json({ error: 'A message exceeds the maximum allowed length of 1000 characters.' });
        return;
      }
    }

    const lastUserMessage = String(messages[messages.length - 1]?.text ?? '').slice(0, 500);
    if (!lastUserMessage) {
      res.status(400).json({ error: 'Latest user message text is required.' });
      return;
    }

    const conversationHistoryString = messages
      .slice(Math.max(0, messages.length - 7), messages.length - 1)
      .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Customer' : 'Malwa Concierge'}: ${m.text}`)
      .join('\n');

    const fullPrompt = `Conversation history:\n${conversationHistoryString}\n\nThe guest asks: "${lastUserMessage}"\nResponse:`;

    try {
      const ai = getGemini();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: fullPrompt,
        config: {
          systemInstruction: INITIAL_CONCIERGE_PROMPT,
          temperature: 0.8,
          topP: 0.9,
        },
      });
      res.json({ text: response.text ?? 'Namaste Ji. How can I help you today?' });
    } catch {
      // Keyword fallback — keeps chatbot alive without API key
      const lower = lastUserMessage.toLowerCase();
      let fallback = 'Namaste Ji! I would be delighted to guide you through our authentic Malwa namkeens & snacks. What would Aap like to know?';
      if (/menu|eat|food|namkeen/.test(lower))
        fallback = 'Namaste Ji! Our authentic collection spans Ratlami Sev, Hing Sev, Ujjaini Mixture, Dalmoth, Sweets and Festive Gift Boxes. Our Ratlami Sev and Hing Sev are absolute must-tries!';
      else if (/reserve|book|table|seat|order/.test(lower))
        fallback = 'Pranam Ji! You can explore and order all our authentic namkeens directly in our shop, or contact our team for bulk orders.';
      else if (/sweet|jalebi|dessert|mithai/.test(lower))
        fallback = 'Ah, authentic Malwa confections and savouries! Handcrafted with pure ingredients and time-honoured recipes.';
      else if (/hello|hi|namaste/.test(lower))
        fallback = 'Namaste Ji! Pranam! I am Malwa Concierge, your culinary guide at MALWA NAMKEEN HOUSE. How may I serve Aap today?';
      res.json({ text: fallback });
    }
  } catch (err: unknown) {
    console.error('[Concierge] Error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
