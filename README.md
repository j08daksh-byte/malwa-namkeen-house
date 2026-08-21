# Malwa Namkeen House

Authentic Ratlami Sev, Artisanal Namkeens, Sweets & Festive Gifting — Indore, Madhya Pradesh.

## Architecture

| Layer | Stack | Entry point |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | `src-rebuild/` → `src-rebuild/main.tsx` |
| Backend | Node.js + Express + TypeScript | `server.ts` → `dist/server.cjs` |
| Database | MongoDB Atlas (Mongoose) | `server/lib/mongodb.ts` |
| Authentication | JWT + Bcrypt (Server-authoritative) | `server/lib/auth.ts`, `server/routes/auth.ts` |
| Media Storage | Cloudinary | `server/lib/cloudinary.ts` |
| Transactional Email | Resend + Development Simulator | `server/lib/emailService.ts` |

## Local Development

**Prerequisites:** Node.js 20+, MongoDB Atlas cluster.

1. Install dependencies: `npm install`
2. Configure `.env.local` (see `.env.example` for required keys).
3. Build & start:
   ```bash
   npm run build
   npm start
   ```

## Production Build

```bash
npm run lint
npm run build
npm start
```

## Admin Portal

- Access: `/admin`
- Role hierarchy: `super_admin` > `admin` > `customer`
- Staff management: `/admin/staff`
- Protected API routes: `/api/admin/*`
