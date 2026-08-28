import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface HeritageBlock {
  slug: string;
  name: string;
  eyebrow: string;
  description?: string;
  image: string;
  position?: string;
}

const DEFAULT_HERITAGE_BLOCKS: HeritageBlock[] = [
  {
    slug: 'all',
    name: 'Crafted for the shared table',
    eyebrow: 'The Malwa table',
    description: 'Bold, bright and generously layered — every handful carries the warmth of a family recipe.',
    image: '/mishtichaat/chaat-plate.jpg',
    position: 'center',
  },
  {
    slug: 'sev-namkeen',
    name: 'Crisp by tradition',
    eyebrow: 'Handcrafted',
    image: '/mishtichaat/dahi-puri.png',
    position: 'center',
  },
  {
    slug: 'mithai-sweets',
    name: 'Made with patience',
    eyebrow: 'Old city rituals',
    image: '/mishtichaat/jalebi.jpg',
    position: 'center',
  },
  {
    slug: 'mixtures-chivda',
    name: 'Generations of flavour',
    eyebrow: 'Celebration',
    image: '/mishtichaat/dahi-bhalla.jpg',
    position: 'center 55%',
  },
  {
    slug: 'khasta-mathri',
    name: 'Malwa, in every bite',
    eyebrow: 'The everyday feast',
    image: '/mishtichaat/kachori.jpg',
    position: 'center',
  },
  {
    slug: 'gift-hampers',
    name: 'Time-honoured craft',
    eyebrow: 'From our kitchen',
    image: '/mishtichaat/hero-food.jpg',
    position: 'center 70%',
  },
];

const SLOT_CLASSES = [
  'heritage-editorial__feature',
  'heritage-editorial__side-one',
  'heritage-editorial__side-two',
  'heritage-editorial__bottom',
  'heritage-editorial__bottom',
  'heritage-editorial__bottom',
];

const EYEBROW_PRESETS = [
  'The Malwa table',
  'Handcrafted',
  'Old city rituals',
  'Celebration',
  'The everyday feast',
  'From our kitchen',
];

export default function HeritageSpecialities() {
  const [blocks, setBlocks] = useState<HeritageBlock[]>(DEFAULT_HERITAGE_BLOCKS);

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
          if (!isMounted) return;

          // Filter out 'all' category if present in array
          const rawCats = data.categories.filter((c: any) => c.slug !== 'all');

          // Always construct exactly 6 blocks for the Bento grid layout
          const newBlocks: HeritageBlock[] = [];
          for (let i = 0; i < 6; i++) {
            const cat = rawCats[i];
            const fallback = DEFAULT_HERITAGE_BLOCKS[i];

            if (cat) {
              newBlocks.push({
                slug: cat.slug || fallback.slug,
                name: cat.name || fallback.name,
                eyebrow: cat.shortLabel || EYEBROW_PRESETS[i] || 'Heritage Category',
                description: i === 0 ? (cat.description || fallback.description) : undefined,
                image: (cat.image && typeof cat.image === 'string' && cat.image.trim()) ? cat.image : fallback.image,
                position: fallback.position || 'center',
              });
            } else {
              // Fill remaining slots up to 6 with curated fallback blocks
              newBlocks.push(fallback);
            }
          }

          setBlocks(newBlocks);
        }
      } catch (err) {
        console.warn('Could not load categories for heritage section, using defaults:', err);
      }
    }

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="heritage" className="heritage-editorial" aria-label="Our Heritage">
      <style>{`
        .heritage-editorial {
          background: #F6EFE3;
          padding: clamp(68px, 9vw, 118px) clamp(20px, 4vw, 48px) clamp(76px, 9vw, 124px);
          overflow: hidden;
        }
        .heritage-editorial__wrap { width: min(100%, 1180px); margin: 0 auto; }
        .heritage-editorial__head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 32px;
          margin-bottom: clamp(32px, 4.5vw, 56px);
        }
        .heritage-editorial__eyebrow,
        .heritage-editorial__card-copy span {
          display: block;
          color: #C99A32;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .heritage-editorial__eyebrow { margin-bottom: 14px; }
        .heritage-editorial__head h2 {
          max-width: 670px;
          margin: 0;
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(34px, 4.4vw, 54px);
          font-weight: 700;
          letter-spacing: -0.025em;
          line-height: 1.04;
        }
        .heritage-editorial__head h2 em { color: #C99A32; font-style: normal; font-weight: 700; }
        .heritage-editorial__view-all {
          flex-shrink: 0;
          margin-bottom: 7px;
          border-bottom: 1px solid rgba(85, 0, 10, 0.45);
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.10em;
          line-height: 1.65;
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .heritage-editorial__view-all:hover { color: #C99A32; border-color: #C99A32; }

        .heritage-editorial__grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          grid-template-rows: 218px 218px 238px;
          gap: 18px;
        }
        .heritage-editorial__card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border-radius: 18px;
          background: #55000A;
          isolation: isolate;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }
        .heritage-editorial__feature { grid-column: span 8; grid-row: span 2; }
        .heritage-editorial__side-one,
        .heritage-editorial__side-two { grid-column: span 4; }
        .heritage-editorial__bottom { grid-column: span 4; }
        .heritage-editorial__image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .heritage-editorial__card:hover .heritage-editorial__image { transform: scale(1.045); }
        .heritage-editorial__shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(30, 10, 5, 0.02) 28%, rgba(31, 8, 8, 0.76) 100%);
          pointer-events: none;
        }
        .heritage-editorial__card-copy {
          position: absolute;
          right: clamp(18px, 2.5vw, 30px);
          bottom: clamp(18px, 2.5vw, 28px);
          left: clamp(18px, 2.5vw, 30px);
          z-index: 1;
        }
        .heritage-editorial__card-copy span { color: #E1B457; font-size: 9.5px; letter-spacing: 0.14em; }
        .heritage-editorial__card-copy h3 {
          margin: 7px 0 0;
          color: #FFF8EC;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: clamp(20px, 2.2vw, 30px);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.1;
          transition: color 0.2s ease;
        }
        .heritage-editorial__card:hover .heritage-editorial__card-copy h3 {
          color: #F0C74E;
        }
        .heritage-editorial__feature .heritage-editorial__card-copy h3 { font-size: clamp(28px, 3.2vw, 42px); }
        .heritage-editorial__card-copy p {
          max-width: 350px;
          margin: 10px 0 0;
          color: rgba(255, 248, 236, 0.85);
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 820px) {
          .heritage-editorial__head { align-items: start; flex-direction: column; gap: 18px; }
          .heritage-editorial__view-all { margin-bottom: 0; }
          .heritage-editorial__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: 330px 218px 218px 230px 230px; gap: 14px; }
          .heritage-editorial__feature { grid-column: span 2; grid-row: span 1; }
          .heritage-editorial__side-one,
          .heritage-editorial__side-two,
          .heritage-editorial__bottom { grid-column: span 1; }
          .heritage-editorial__bottom:last-child { grid-column: 1 / -1; }
          .heritage-editorial__feature .heritage-editorial__card-copy h3 { font-size: clamp(36px, 7vw, 52px); }
        }

        @media (max-width: 520px) {
          .heritage-editorial { padding: 48px 16px 56px; }
          .heritage-editorial__head h2 { font-size: clamp(34px, 9vw, 44px); }
          .heritage-editorial__grid { display: flex; flex-direction: column; gap: 12px; }
          .heritage-editorial__card { height: 220px; flex: 0 0 220px; border-radius: 14px; }
          .heritage-editorial__feature { height: 300px; flex-basis: 300px; }
          .heritage-editorial__feature .heritage-editorial__card-copy h3 { font-size: clamp(28px, 8vw, 36px); }
          .heritage-editorial__card-copy h3 { font-size: clamp(22px, 6vw, 28px); }
          .heritage-editorial__card-copy p { font-size: 12px; line-height: 1.5; }
        }

        @media (hover: none) {
          .heritage-editorial__card:hover .heritage-editorial__image { transform: none; }
        }
      `}</style>

      <div className="heritage-editorial__wrap">
        <header className="heritage-editorial__head">
          <div>
            <span className="heritage-editorial__eyebrow">Our Heritage</span>
            <h2>Flavours shaped by <em>tradition</em></h2>
          </div>
          <Link className="heritage-editorial__view-all" to="/shop">Explore The Shop →</Link>
        </header>

        <div className="heritage-editorial__grid">
          {blocks.slice(0, 6).map((block, index) => {
            const layoutClass = SLOT_CLASSES[index] || 'heritage-editorial__bottom';
            const targetUrl = block.slug === 'all' ? '/shop' : `/shop?category=${encodeURIComponent(block.slug)}`;

            return (
              <Link
                key={`heritage-${block.slug}-${index}`}
                to={targetUrl}
                className={`heritage-editorial__card ${layoutClass}`}
                aria-label={`Shop ${block.name}`}
              >
                <img
                  src={block.image}
                  alt={block.name}
                  className="heritage-editorial__image"
                  style={{ objectPosition: block.position || 'center' }}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <div className="heritage-editorial__shade" />
                <div className="heritage-editorial__card-copy">
                  <span>{block.eyebrow}</span>
                  <h3>{block.name}</h3>
                  {block.description && <p>{block.description}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
