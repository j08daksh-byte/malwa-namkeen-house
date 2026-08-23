import React, { useEffect, useState, useCallback } from 'react';

const INTRO_SESSION_KEY = 'malwa_intro_session_seen';
const TOTAL_DURATION_MS = 3400; // Poised and relaxed pacing for luxury reveal
const FADE_START_MS = 2700;     // Gives 0.8s hold after reveal before fading
const REDUCED_MOTION_DURATION_MS = 700;
const SAFETY_FALLBACK_MS = 4200;

function getInitialIntroState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !sessionStorage.getItem(INTRO_SESSION_KEY);
  } catch {
    return false;
  }
}

export default function BrandIntro() {
  // Synchronous initialization prevents any 1-frame flash of the website
  const [shouldRender, setShouldRender] = useState<boolean>(getInitialIntroState);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const dismissIntro = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    } catch {
      // Ignore storage access errors
    }
    setShouldRender(false);
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fadeStartDelay = prefersReducedMotion ? 400 : FADE_START_MS;
    const completeDelay = prefersReducedMotion ? REDUCED_MOTION_DURATION_MS : TOTAL_DURATION_MS;

    // 2. Trigger graceful fade out
    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, fadeStartDelay);

    // 3. Complete and unmount
    const finishTimer = window.setTimeout(() => {
      dismissIntro();
    }, completeDelay);

    // 4. Hard safety fallback — guarantees the user is never stuck
    const safetyTimer = window.setTimeout(() => {
      dismissIntro();
    }, SAFETY_FALLBACK_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [dismissIntro]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      id="brand-intro-overlay"
      role="status"
      aria-label="Welcome to MALWA NAMKEEN HOUSE"
      aria-live="polite"
      onClick={dismissIntro}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 48%, #FFFDF8 0%, #F6EFE3 55%, #EBE1D0 100%)',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.025)' : 'scale(1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      <style>{`
        /* ── Intro Animations (Relaxed & Poised Timing) ───────────────── */
        @keyframes introLogoEntry {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
            filter: blur(4px);
          }
          65% {
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        @keyframes introTitleEntry {
          0% {
            opacity: 0;
            transform: translateY(10px);
            letter-spacing: 0.18em;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0.12em;
          }
        }

        @keyframes introTaglineEntry {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes introFrameGlow {
          0% {
            opacity: 0;
            transform: scale(0.985);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .intro-frame {
          position: absolute;
          inset: clamp(14px, 2.5vw, 32px);
          border: 1px solid rgba(201, 154, 50, 0.28);
          pointer-events: none;
          animation: introFrameGlow 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .intro-frame-inner {
          position: absolute;
          inset: 6px;
          border: 1px solid rgba(85, 0, 10, 0.08);
          pointer-events: none;
        }

        .intro-corner {
          position: absolute;
          width: 14px;
          height: 14px;
          border-color: #C99A32;
          border-style: solid;
        }
        .intro-corner-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .intro-corner-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .intro-corner-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
        .intro-corner-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        .intro-center-glow {
          position: absolute;
          width: clamp(280px, 50vw, 620px);
          height: clamp(280px, 50vw, 620px);
          background: radial-gradient(circle, rgba(212, 170, 69, 0.16) 0%, rgba(85, 0, 10, 0.03) 45%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          filter: blur(20px);
        }

        .intro-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 24px;
          max-width: 92vw;
        }

        .intro-logo-wrap {
          animation: introLogoEntry 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
          margin-bottom: 22px;
          filter: drop-shadow(0 12px 24px rgba(85, 0, 10, 0.12));
        }

        .intro-logo-img {
          height: clamp(88px, 14vw, 140px);
          width: auto;
          max-width: min(82vw, 360px);
          object-fit: contain;
        }

        .intro-brand-name {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 5.2vw, 46px);
          font-weight: 700;
          line-height: 1.12;
          color: #55000A;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin: 0 0 14px;
          animation: introTitleEntry 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
          text-shadow: 0 2px 10px rgba(85, 0, 10, 0.07);
        }

        .intro-divider-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          width: 100%;
          max-width: 360px;
          margin: 0 0 14px;
          animation: introTaglineEntry 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
        }

        .intro-line {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, rgba(201, 154, 50, 0.65), transparent);
        }

        .intro-diamond {
          width: 6px;
          height: 6px;
          background-color: #C99A32;
          transform: rotate(45deg);
          box-shadow: 0 0 6px rgba(201, 154, 50, 0.6);
        }

        .intro-tagline {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(11px, 2vw, 13.5px);
          font-weight: 800;
          color: #C99A32;
          text-transform: uppercase;
          letter-spacing: 0.30em;
          margin: 0;
          animation: introTaglineEntry 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both;
        }

        @media (max-width: 380px) {
          .intro-brand-name {
            font-size: 22px;
            letter-spacing: 0.10em;
          }
          .intro-tagline {
            font-size: 10px;
            letter-spacing: 0.20em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-brand-name,
          .intro-divider-wrap,
          .intro-tagline,
          .intro-frame {
            animation-duration: 0.3s !important;
            animation-delay: 0s !important;
            animation-name: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>

      {/* Decorative Frame */}
      <div className="intro-frame">
        <div className="intro-frame-inner" />
        <div className="intro-corner intro-corner-tl" />
        <div className="intro-corner intro-corner-tr" />
        <div className="intro-corner intro-corner-bl" />
        <div className="intro-corner intro-corner-br" />
      </div>

      {/* Ambient warm radial glow */}
      <div className="intro-center-glow" />

      {/* Center Cinematic Brand Element */}
      <div className="intro-content">
        <h1 className="intro-brand-name">
          MALWA NAMKEEN HOUSE
        </h1>

        <div className="intro-divider-wrap">
          <div className="intro-line" />
          <div className="intro-diamond" />
          <div className="intro-line" />
        </div>

        <p className="intro-tagline">
          THE NAMKEEN &amp; SNACKS HUB
        </p>
      </div>
    </div>
  );
}
