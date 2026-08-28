import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface BestSellerProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  price?: number;
  badge?: string;
  position?: string;
}

const FALLBACK_BEST_SELLERS: BestSellerProduct[] = [
  {
    id: 'ratlami-sev-special',
    slug: 'ratlami-sev-special',
    name: 'Special Ratlami Sev',
    image: '/mishtichaat/chaat-plate.jpg',
    price: 120,
    badge: 'Best Seller',
    position: 'center 35%',
  },
  {
    id: 'ujjaini-sev-classic',
    slug: 'ujjaini-sev-classic',
    name: 'Royal Ujjaini Sev',
    image: '/mishtichaat/dahi-puri.png',
    price: 110,
    badge: 'Best Seller',
    position: 'center 40%',
  },
  {
    id: 'khasta-heeng-mathri',
    slug: 'khasta-heeng-mathri',
    name: 'Khasta Heeng Mathri',
    image: '/mishtichaat/kachori.jpg',
    price: 130,
    badge: 'Best Seller',
    position: 'center 45%',
  },
  {
    id: 'khatta-meetha-chivda',
    slug: 'khatta-meetha-chivda',
    name: 'Khatta Meetha Mixture',
    image: '/mishtichaat/jalebi.jpg',
    price: 125,
    badge: 'Best Seller',
    position: 'center 45%',
  },
];

export default function SignatureDelicacies() {
  const [products, setProducts] = useState<BestSellerProduct[]>(FALLBACK_BEST_SELLERS);

  useEffect(() => {
    let isMounted = true;
    async function fetchBestSellers() {
      try {
        const res = await fetch('/api/products/best-sellers');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          if (!isMounted) return;

          const loaded: BestSellerProduct[] = data.products.slice(0, 4).map((p: any, idx: number) => {
            const fallback = FALLBACK_BEST_SELLERS[idx] || FALLBACK_BEST_SELLERS[0];
            const primaryImg =
              (Array.isArray(p.images) && p.images[0]) ||
              p.image ||
              fallback.image;

            const minPrice =
              Array.isArray(p.options) && p.options.length > 0
                ? p.options[0]?.price
                : p.price || fallback.price;

            return {
              id: p.id || p._id || fallback.id,
              slug: p.slug || p.id || fallback.slug,
              name: p.name || fallback.name,
              image: primaryImg,
              price: minPrice,
              badge: p.badge || 'Best Seller',
              position: fallback.position || 'center',
            };
          });

          // Pad up to 4 if fewer returned
          while (loaded.length < 4) {
            loaded.push(FALLBACK_BEST_SELLERS[loaded.length]);
          }

          setProducts(loaded.slice(0, 4));
        }
      } catch (err) {
        console.warn('Could not load best sellers, using fallback:', err);
      }
    }

    fetchBestSellers();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="sweets" aria-label="Our Best Sellers">
      <style>{`
        /* ── Section ─────────────────────────────────────────────── */
        #sweets {
          background: linear-gradient(160deg, #6B000D 0%, #55000A 100%);
          padding: 64px 56px;
          overflow: hidden;
        }

        #sweets .sd-inner {
          max-width: 1440px;
          margin-inline: auto;
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 42px;
          align-items: center;
        }

        /* ── Left text block ───────────────────────────────────── */
        #sweets .sd-text {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        #sweets .sd-eyebrow {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: #D6A93E;
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 16px;
        }
        #sweets .sd-eyebrow-line {
          width: 22px;
          height: 1px;
          background: rgba(200,154,61,0.55);
          flex-shrink: 0;
        }

        #sweets .sd-heading {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(34px, 4.4vw, 54px);
          line-height: 1.04;
          font-weight: 700;
          color: #FFF8EC;
          margin: 0 0 16px;
          letter-spacing: -0.025em;
        }
        #sweets .sd-heading em {
          display: block;
          font-style: normal;
          color: #D4AA45;
          font-weight: 700;
        }

        #sweets .sd-rule {
          width: 36px;
          height: 1.5px;
          background: linear-gradient(90deg, #C99A32, rgba(201,154,50,0.28));
          border-radius: 2px;
          margin-bottom: 18px;
        }

        #sweets .sd-desc {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 14.5px;
          font-weight: 400;
          line-height: 1.55;
          color: rgba(255,248,236,0.84);
          max-width: 300px;
          margin-bottom: 26px;
        }

        #sweets .sd-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #D4AA45;
          color: #2C0612;
          border: none;
          border-radius: 999px;
          height: 48px;
          padding: 0 26px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          align-self: flex-start;
          box-shadow: 0 10px 24px rgba(200,154,61,0.22);
          transition: background 0.20s, transform 0.20s, box-shadow 0.20s;
          white-space: nowrap;
        }
        #sweets .sd-btn:hover {
          background: #C99A32;
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(200,154,61,0.30);
        }

        /* ── Right: cards grid ─────────────────────────────────── */
        #sweets .sd-right {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }

        /* ── Cards grid ────────────────────────────────────────── */
        #sweets .sd-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        /* ── Individual card ───────────────────────────────────── */
        #sweets .sd-card {
          position: relative;
          aspect-ratio: 0.78 / 1;
          min-width: 0;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(200,154,61,0.42);
          background: #55000A;
          box-shadow: 0 12px 28px rgba(0,0,0,0.16);
          text-decoration: none;
          display: block;
          cursor: pointer;
          transition: transform 0.30s ease, border-color 0.30s ease, box-shadow 0.30s ease;
        }

        @media (hover: hover) {
          #sweets .sd-card:hover {
            transform: translateY(-5px);
            border-color: rgba(240,199,78,0.80);
            box-shadow: 0 20px 38px rgba(0,0,0,0.24);
          }
          #sweets .sd-card:hover .sd-card-img {
            transform: scale(1.06);
          }
          #sweets .sd-card:hover .sd-card-name {
            color: #F0C74E;
          }
        }

        /* Image fills the entire card */
        #sweets .sd-card-img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform 0.50s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Badge top right */
        #sweets .sd-card-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(43, 6, 15, 0.85);
          backdrop-filter: blur(4px);
          color: #F0C74E;
          border: 1px solid rgba(240,199,78,0.4);
          font-size: 9.5px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          z-index: 2;
        }

        /* Gradient overlay at the bottom */
        #sweets .sd-card-overlay {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          min-height: 84px;
          padding: 28px 16px 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.82) 0%,
            rgba(0,0,0,0.45) 60%,
            transparent 100%
          );
          z-index: 1;
        }

        /* Tiny gold line above title */
        #sweets .sd-card-line {
          width: 22px;
          height: 1px;
          background: rgba(200,154,61,0.70);
          border-radius: 2px;
          margin-bottom: 6px;
          flex-shrink: 0;
        }

        #sweets .sd-card-name {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 15px;
          font-weight: 700;
          line-height: 1.2;
          color: #FFF8EC;
          letter-spacing: -0.01em;
          transition: color 0.2s ease;
        }

        #sweets .sd-card-price {
          font-size: 11.5px;
          font-weight: 700;
          color: #E1B457;
          margin-top: 3px;
        }

        /* ── Tablet 768–1100px ─────────────────────────────────── */
        @media (max-width: 1100px) {
          #sweets {
            padding: 52px 36px;
          }
          #sweets .sd-inner {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          #sweets .sd-desc {
            max-width: 100%;
          }
          #sweets .sd-cards {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }
        }

        /* ── Mobile < 768px ───────────────────────────────────── */
        @media (max-width: 768px) {
          #sweets {
            padding: 44px 20px;
          }
          #sweets .sd-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          #sweets .sd-card {
            aspect-ratio: 0.85 / 1;
          }
          #sweets .sd-heading {
            font-size: clamp(28px, 7vw, 38px);
          }
        }

        @media (max-width: 480px) {
          #sweets .sd-card-name {
            font-size: 13.5px;
          }
        }
      `}</style>

      <div className="sd-inner">
        {/* ── Left column ─────────────────────────────────────── */}
        <div className="sd-text">
          <span className="sd-eyebrow">
            <span className="sd-eyebrow-line" aria-hidden="true" />
            Signature Best Sellers
          </span>
          <h2 className="sd-heading">
            Curated Delicacies
            <em>Just For You</em>
          </h2>
          <div className="sd-rule" aria-hidden="true" />
          <p className="sd-desc">
            From peppery clove-infused sevs to crunchy heritage mixtures, every bite is a journey through authentic Malwa flavours.
          </p>
          <Link to="/shop" className="sd-btn">
            Explore The Shop
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* ── Right column: 4 Best Seller cards ───────────────── */}
        <div className="sd-right">
          <div className="sd-cards" role="list">
            {products.slice(0, 4).map((dish, i) => (
              <Link
                key={`bestseller-${dish.id}-${i}`}
                to={`/product/${encodeURIComponent(dish.slug)}`}
                className="sd-card"
                role="listitem"
                aria-label={`View ${dish.name}`}
              >
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="sd-card-img"
                  style={{ objectPosition: dish.position || 'center' }}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <span className="sd-card-badge">Best Seller</span>
                <div className="sd-card-overlay">
                  <div className="sd-card-line" aria-hidden="true" />
                  <span className="sd-card-name">{dish.name}</span>
                  {dish.price && (
                    <span className="sd-card-price">From ₹{dish.price}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
