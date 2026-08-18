/**
 * MishtiChaat — Express server
 * Handles all API routes and serves the Vite SPA.
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import enquiryRoutes from './server/routes/enquiries.ts';
import adminRoutes, { publicSettingsRoute } from './server/routes/admin.ts';
import { BUSINESS } from './server/config.ts';

dotenv.config();

// ── Environment validation ───────────────────────────────────────────────────

const REQUIRED_ENV: string[] = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const OPTIONAL_WARNED: string[] = ['RESEND_API_KEY', 'GEMINI_API_KEY', 'SUPABASE_ANON_KEY'];

function validateEnv() {
  const missing = REQUIRED_ENV.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[Startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  for (const k of OPTIONAL_WARNED) {
    if (!process.env[k]) {
      console.warn(`[Startup] Optional env var ${k} not set — related features will be degraded.`);
    }
  }
}

// ── Gemini client ────────────────────────────────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing');
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const MENU_CONTEXT_SUMMARY = `
- breakfast:
  * Poori & Sabji (₹120): Poori served with slow-cooked pumpkin & mix veg, green chilli pickle, and sonth chutney. (Best Seller)
  * Kachauri & Sabji (₹160): Traditional Banarasi kachauris served with light masala potato gravy, crispy Jalebi, and chutneys. (Chef Special)
  * Aloo Paratha (₹100): Wheat paratha served with curd, mint chutney, and butter.
  * Sattu/Paneer Paratha (₹120): Paratha stuffed with spicy roasted chana sattu or fresh paneer.
  * Chole Bhature (₹200): Fluffy bhature served with slow-cooked spicy dark chole, achari potatoes.
  * Chole Kulche (₹130): Butter toasted bread kulcha with dry white peas masala.

- chaat:
  * Banarsi Pani Poori (₹60): 5 crispy wheat / suji balls with mint & sweet sonth waters.
  * Aloo Tikki Chaat (₹100): Potato patties served with yellow peas chole, seasoned curds, sweet and spicy chutneys. (Best Seller)
  * Dahi Bhalla (₹120): Soft urad dal dumplings in thick cream yoghurt, roasted spices.
  * Raj Kachori (₹140): Emperor kachori packed with sprouts, dahi vada, yoghurt, sev, and pomegranate. (Chef Special)
  * Samosa Chaat (₹120): Flaky samosa crushed in chickpea chole, curds, sonth, and green chutneys.
  * Kashi Tamatar Chaat (₹120): Slow-cooked spiced mashed tomatoes with green peas, dry fruits, seasoned with hing-jeera cow ghee syrup.

- mains:
  * Arhar Daal Ghee Tadka (₹200): Comfy split pigeon peas with high ghee-cumin-garlic tempering.
  * Daal Makhani (₹240): Slow simmed black lentils and kidney beans topped with fresh cream, butter.
  * Paneer Butter Masala (₹250): Fresh cottage cheese blocks in cream tomato-cashew curry.
  * Daal Bati Chokha (₹260): Sattu bati dipped in desi ghee with eggplant mashed chokha, rice, dal, and Kheer.
  * Puratan Special Khichdi (₹210): Light moong dal rice cooked in ghee, served with bhartha, papad, chutneys.

- mithai (Sweets):
  * Desi Ghee Jalebi (100gm, ₹80): Golden crispy sweet spirals fried in 100% desi cow ghee.
  * Shahi Rabadi (100gm, ₹100): Granular thickened cardamon milk.
  * Ras Malai (1 Pc, ₹50): Soft cottage cheese sponges inside pistachio saffron milk.
  * Gulab Jamun (₹40), Rasgulla (₹40): Classic high-quality melt-in-mouth delicacies.

- beverages:
  * Special Kulladh Chai (₹40): Spiced milk tea served in organic clay cups.
  * Banarsi Shahi Thandai (₹120): Cool energy mix of nuts, black pepper, fennel, and rose.
  * Kulladh Lassi (₹100): Curd whipped thick with fresh milk malai, almonds, pistachios.
`;

const INITIAL_CONCIERGE_PROMPT = `
You are Mishti Concierge, the extremely warm, polite, and deeply cultured culinary concierge assistant at MishtiChaat, a premium heritage Indian café in Bengaluru.
Your tone is welcoming, highly respectful, and warm (refer to guests as 'Aap' or 'Ji', start with 'Namaste' or 'Pranam', and use words reflecting hospitality). You are extremely passionate about Varanasi's culinary lineage and recipes.

Available food items on our menu and prices are detailed below:
${MENU_CONTEXT_SUMMARY}

Follow these strictly:
1. Refer to yourself as "Mishti Concierge".
2. Speak about Kashi and our café with real warmth and passion.
3. If they chat in English or Hindi, respond naturally in a warm, friendly mix of both.
4. Suggest amazing culinary pairings! Recommend Shahi Rabadi (₹100) WITH Desi Ghee Jalebi (₹80).
5. Calculate estimated pricing for requested items if asked.
6. Keep answers compact, conversational, maximum 3 short paragraphs.
7. If they wish to reserve a spot or book catering, advise them to use the Reserve button or contact us on WhatsApp (+91 90350 56691).
`;

// ── Server bootstrap ─────────────────────────────────────────────────────────

async function startServer() {
  validateEnv();

  const app  = express();
  const PORT = Number(process.env.PORT ?? 3000);
  const isProd = process.env.NODE_ENV === 'production';

  // ── Security middleware ───────────────────────────────────────────────────

  app.use(helmet({
    contentSecurityPolicy: false, // Vite injects inline scripts in dev
    crossOriginEmbedderPolicy: false,
  }));

  // CORS — locked to configured origins, never *
  const allowedOrigins = (() => {
    const configured = process.env.ALLOWED_ORIGINS ?? '';
    const base = configured
      ? configured.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    // Always allow localhost in dev
    if (!isProd) {
      base.push('http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173');
    }
    const appUrl = process.env.APP_URL;
    if (appUrl) base.push(appUrl);
    return base;
  })();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // JSON body — 100kb limit
  app.use(express.json({ limit: '100kb' }));

  // ── Rate limits ───────────────────────────────────────────────────────────

  const formLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: 'Too many submissions. Please wait a few minutes before trying again.',
    },
  });

  const conciergeLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
      success: false,
      message: 'Too many requests to the concierge. Please wait a moment.',
    },
  });

  // ── API routes ────────────────────────────────────────────────────────────

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), service: BUSINESS.name });
  });

  // Public settings (menu PDF URL, Google Maps URL, etc.) — no auth required
  publicSettingsRoute(app);

  // Admin routes must be registered BEFORE app.use('/api', formLimiter, ...)
  // to prevent the form rate-limiter from intercepting admin requests.
  app.use('/api/admin', adminRoutes);

  // Form submission routes — rate-limited. Registered after /api/admin so the
  // formLimiter only applies to enquiry endpoints, not admin endpoints.
  app.use('/api', formLimiter, enquiryRoutes);

  // ── Concierge chatbot ─────────────────────────────────────────────────────

  app.post('/api/concierge', conciergeLimiter, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const lastUserMessage = String(messages[messages.length - 1]?.text ?? '').slice(0, 500);
      if (!lastUserMessage) {
        res.status(400).json({ error: 'Latest user message text is required.' });
        return;
      }

      const conversationHistoryString = messages
        .slice(Math.max(0, messages.length - 7), messages.length - 1)
        .map((m: { sender: string; text: string }) => `${m.sender === 'user' ? 'Guest' : 'Kashi-Ji'}: ${m.text}`)
        .join('\n');

      const fullPrompt = `Conversation history:\n${conversationHistoryString}\n\nThe guest asks: "${lastUserMessage}"\nResponse:`;

      try {
        const ai = getGemini();
        const response = await ai.models.generateContent({
          model:    'gemini-2.0-flash',
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
        let fallback = 'Namaste Ji! I would be delighted to guide you through our Kashi heritage menu. What would Aap like to know?';
        if (/menu|eat|food/.test(lower))
          fallback = 'Namaste Ji! Our heritage menu spans Breakfast, Chaat, Mains, Mithai and Beverages. Our Tamatar Chaat (₹120) and Jalebi with Rabadi (₹80 + ₹100) are absolute must-tries!';
        else if (/reserve|book|table|seat/.test(lower))
          fallback = 'Pranam Ji! To reserve a table, click the "Reserve a Table" button at the top. Our team will confirm your booking personally.';
        else if (/sweet|jalebi|dessert|mithai/.test(lower))
          fallback = 'Ah, Meethi Gali Ji! Our pure Desi Ghee Jalebis (₹80) paired with Shahi Rabadi (₹100) — the pride of Banaras!';
        else if (/hello|hi|namaste/.test(lower))
          fallback = 'Namaste Ji! Pranam! I am Mishti Concierge, your culinary guide at MishtiChaat. How may I serve Aap today?';
        res.json({ text: fallback });
      }
    } catch (err: unknown) {
      console.error('[Concierge] Error:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // ── Static / Vite ─────────────────────────────────────────────────────────

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── Global error handler ──────────────────────────────────────────────────

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${BUSINESS.name}] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
