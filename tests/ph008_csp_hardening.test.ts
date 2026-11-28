import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import helmet from 'helmet';
import http from 'http';

function createTestApp(isProd: boolean) {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.googleusercontent.com", "https://accounts.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://accounts.google.com"],
        frameSrc: ["'self'", "https://accounts.google.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      }
    } : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.get('/', (req, res) => res.send('ok'));
  return app;
}

describe('PH-008 — Content-Security-Policy (CSP) Hardening', () => {
  it('should disable CSP in development (contentSecurityPolicy: false)', async () => {
    const app = createTestApp(false);
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const res = await fetch(`http://localhost:${port}/`);
    assert.equal(res.headers.has('content-security-policy'), false);
    server.close();
  });

  it('should enable strict CSP in production', async () => {
    const app = createTestApp(true);
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const res = await fetch(`http://localhost:${port}/`);
    
    const csp = res.headers.get('content-security-policy');
    assert.ok(csp, 'CSP header should be present');
    assert.ok(csp.includes("default-src 'self'"));
    assert.ok(csp.includes("script-src 'self' https://accounts.google.com"));
    assert.ok(csp.includes("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"));
    assert.ok(csp.includes("img-src 'self' data: https://res.cloudinary.com https://*.googleusercontent.com https://accounts.google.com"));
    assert.ok(csp.includes("font-src 'self' https://fonts.gstatic.com"));
    assert.ok(csp.includes("connect-src 'self' https://accounts.google.com"));
    assert.ok(csp.includes("frame-src 'self' https://accounts.google.com"));
    assert.ok(csp.includes("object-src 'none'"));
    server.close();
  });

  it('should NOT allow unsafe-eval in production', async () => {
    const app = createTestApp(true);
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as any).port;
    const res = await fetch(`http://localhost:${port}/`);
    const csp = res.headers.get('content-security-policy');
    assert.ok(!csp!.includes("'unsafe-eval'"));
    server.close();
  });
});
