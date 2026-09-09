import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface BannerSlide {
  id: string | number;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaText?: string;
  alt: string;
  link: string;
}

const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 1,
    image: '/hero-banner-1.png',
    title: 'Pure Malwa Heritage in Every Crunchy Bite',
    subtitle: 'Special Ratlami Sev & Artisanal Namkeens',
    badge: 'EST. 1954',
    ctaText: 'SHOP NOW',
    alt: 'Pure Malwa Heritage in Every Crunchy Bite - Special Ratlami Sev & Artisanal Namkeens',
    link: '/shop',
  },
  {
    id: 2,
    image: '/hero-banner-2.png',
    title: 'Add the Malwa Crunch',
    subtitle: 'Roasted Not Fried, No Palm Oil',
    badge: 'SNACK TIME',
    ctaText: 'EXPLORE SHOP',
    alt: 'Add the Malwa Crunch: Complete Your Snack Time - Roasted Not Fried, No Palm Oil',
    link: '/shop',
  },
];

const AUTOPLAY_INTERVAL = 5000; // 5 seconds per slide

export default function Hero({ onReserve: _onReserve }: { onReserve?: () => void }) {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<BannerSlide[]>(DEFAULT_BANNER_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Fetch active banners from API
  useEffect(() => {
    let isMounted = true;
    async function fetchBanners() {
      try {
        const res = await fetch('/api/banners');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.banners) && data.banners.length > 0) {
          if (isMounted) {
            setSlides(
              data.banners.map((b: any, idx: number) => ({
                id: b.id || b._id || idx + 1,
                image: b.image,
                mobileImage: b.mobileImage,
                title: b.title || b.alt,
                subtitle: b.subtitle,
                badge: b.badge || 'MALWA HERITAGE',
                ctaText: b.ctaText || 'SHOP NOW',
                alt: b.alt || b.title || 'Malwa Namkeen House Hero Banner',
                link: b.link || '/shop',
              }))
            );
            setCurrentSlide(0);
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic banners, using defaults:', err);
      }
    }
    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, totalSlides]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || totalSlides <= 1) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) nextSlide();
      else prevSlide();
    }
    touchStartXRef.current = null;
  };

  return (
    <section
      id="hero"
      className="hero-carousel-section"
      aria-label="Malwa Namkeen Featured Banners"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .hero-carousel-section {
          width: 100%;
          position: relative;
          overflow: hidden;
          background: #FAF6F0;
          user-select: none;
        }

        .hero-carousel-track {
          position: relative;
          width: 100%;
          display: flex;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.85s cubic-bezier(0.25, 1, 0.5, 1), transform 0.85s cubic-bezier(0.25, 1, 0.5, 1);
          transform: scale(1.02);
          cursor: pointer;
        }

        .hero-slide--active {
          position: relative;
          opacity: 1;
          visibility: visible;
          transform: scale(1);
          z-index: 2;
        }

        .hero-slide-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
          object-position: center center;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-slide:hover .hero-slide-img {
          transform: scale(1.01);
        }

        /* ── Arrow Controls ─────────────────────────────────── */
        .hero-nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 253, 248, 0.88);
          border: 1.5px solid rgba(200, 154, 61, 0.45);
          color: #55000A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 4px 16px rgba(85, 0, 10, 0.15);
          opacity: 0;
          transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(4px);
        }

        .hero-carousel-section:hover .hero-nav-arrow {
          opacity: 0.95;
        }

        .hero-nav-arrow:hover {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
          transform: translateY(-50%) scale(1.1);
          opacity: 1 !important;
        }

        .hero-nav-arrow--prev {
          left: 18px;
        }

        .hero-nav-arrow--next {
          right: 18px;
        }

        /* ── Modern Pagination Dots ─────────────────────────── */
        .hero-carousel-dots {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 10;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(43, 33, 30, 0.35);
          backdrop-filter: blur(6px);
        }

        .hero-dot-btn {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.55);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-dot-btn--active {
          width: 28px;
          background: #FFF8EC;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        }

        .hero-mobile-overlay,
        .hero-mobile-content {
          display: none;
        }

        @media (max-width: 768px) {
          .hero-nav-arrow {
            display: none;
          }
          .hero-carousel-dots {
            bottom: 12px;
            gap: 6px;
            padding: 4px 8px;
          }
          .hero-dot-btn {
            width: 8px;
            height: 8px;
          }
          .hero-dot-btn--active {
            width: 20px;
          }
        }

        @media (max-width: 640px) {
          .hero-carousel-section {
            min-height: 380px;
            height: clamp(380px, 86vw, 440px);
          }
          .hero-carousel-track {
            height: 100%;
          }
          .hero-slide {
            height: 100%;
          }
          .hero-slide-img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: 78% center;
          }
          .hero-mobile-overlay {
            display: block;
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(35, 3, 10, 0.20) 0%, rgba(35, 3, 10, 0.52) 40%, rgba(35, 3, 10, 0.92) 100%);
            pointer-events: none;
            z-index: 2;
          }
          .hero-mobile-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-end;
            position: absolute;
            inset: 0;
            padding: 20px 20px 38px;
            gap: 8px;
            z-index: 3;
            pointer-events: none;
          }
          .hero-mobile-badge {
            display: inline-block;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #F0DFA0;
            background: rgba(200, 154, 61, 0.22);
            border: 1px solid rgba(200, 154, 61, 0.45);
            padding: 3px 10px;
            border-radius: 999px;
          }
          .hero-mobile-title {
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: clamp(20px, 5.8vw, 26px);
            font-weight: 700;
            color: #FFF8EC;
            margin: 0;
            line-height: 1.15;
            letter-spacing: -0.02em;
          }
          .hero-mobile-sub {
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 12.5px;
            color: rgba(255, 248, 236, 0.85);
            margin: 0;
            line-height: 1.4;
          }
          .hero-mobile-cta {
            pointer-events: auto;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 44px;
            min-height: 44px;
            padding: 0 20px;
            background: #D4AA45;
            color: #3C0815;
            border: none;
            border-radius: 999px;
            font-family: var(--font-primary, 'DM Sans', sans-serif);
            font-size: 11.5px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            margin-top: 4px;
          }
        }
      `}</style>

      {/* Previous Slide Arrow (only if multiple slides) */}
      {totalSlides > 1 && (
        <button
          type="button"
          className="hero-nav-arrow hero-nav-arrow--prev"
          onClick={prevSlide}
          aria-label="Previous banner slide"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Carousel Track with Slides */}
      <div className="hero-carousel-track">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`hero-slide ${isActive ? 'hero-slide--active' : ''}`}
              onClick={() => navigate(slide.link)}
              role="button"
              tabIndex={isActive ? 0 : -1}
              aria-label={slide.alt}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="hero-slide-img"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <div className="hero-mobile-overlay" aria-hidden="true" />
              <div className="hero-mobile-content">
                {slide.badge && <span className="hero-mobile-badge">{slide.badge}</span>}
                <h2 className="hero-mobile-title">{slide.title || slide.alt}</h2>
                {slide.subtitle && <p className="hero-mobile-sub">{slide.subtitle}</p>}
                <button
                  type="button"
                  className="hero-mobile-cta"
                  onClick={e => {
                    e.stopPropagation();
                    navigate(slide.link);
                  }}
                  aria-label={`${slide.ctaText || 'Shop Now'} — ${slide.title || slide.alt}`}
                >
                  <span>{slide.ctaText || 'SHOP NOW'}</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Slide Arrow (only if multiple slides) */}
      {totalSlides > 1 && (
        <button
          type="button"
          className="hero-nav-arrow hero-nav-arrow--next"
          onClick={nextSlide}
          aria-label="Next banner slide"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Pagination Indicator Dots (only if multiple slides) */}
      {totalSlides > 1 && (
        <div className="hero-carousel-dots" role="tablist" aria-label="Banner slide indicators">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={`dot-${slide.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`hero-dot-btn ${isActive ? 'hero-dot-btn--active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to banner slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
