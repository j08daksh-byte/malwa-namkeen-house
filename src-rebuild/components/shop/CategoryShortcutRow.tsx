import React, { useRef } from 'react';
import { type ShopCategory } from '../../data/products';

interface CategoryShortcutRowProps {
  categories: ShopCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts?: Record<string, number>;
}

// Representative images matching Malwa's actual culinary catalog
const CATEGORY_IMAGES: Record<string, string> = {
  all: '/mishtichaat/chaat-plate.jpg',
  'sev-namkeen': '/mishtichaat/dahi-puri.png',
  'mixtures-chivda': '/mishtichaat/hero-food.jpg',
  'khasta-mathri': '/mishtichaat/kachori.jpg',
  'mithai-sweets': '/mishtichaat/hero-sweets.jpg',
  'gift-hampers': '/mishtichaat/FAMILY%20FEAST%20THALI.png',
  'falahari-fasting': '/mishtichaat/Image-1.png',
};

// Clean, punchy uppercase display labels matching the Eat Better style
const CATEGORY_DISPLAY_TITLES: Record<string, string> = {
  all: 'ALL DELICACIES',
  'sev-namkeen': 'SEV & NAMKEEN',
  'mixtures-chivda': 'MIXTURES',
  'khasta-mathri': 'MATHRI & SNACKS',
  'mithai-sweets': 'SWEETS & LADDOOS',
  'gift-hampers': 'GIFT HAMPERS',
  'falahari-fasting': 'FALAHARI & FASTING',
};

export default function CategoryShortcutRow({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}: CategoryShortcutRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="cat-row-wrapper" aria-label="Product categories shortcut">
      <style>{`
        .cat-row-wrapper {
          position: relative;
          margin-bottom: 28px;
          width: 100%;
        }

        .cat-row-scroll-container {
          display: flex;
          align-items: center;
          gap: 14px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 6px 4px 14px;
          scroll-snap-type: x mandatory;
        }

        .cat-row-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .cat-card-btn {
          flex: 0 0 auto;
          scroll-snap-align: start;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: #FFFDF9;
          border: 1.5px solid rgba(200, 154, 61, 0.28);
          border-radius: 16px;
          padding: 8px 18px 8px 8px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 10px rgba(85, 0, 10, 0.04);
          text-align: left;
          user-select: none;
          outline: none;
        }

        .cat-card-btn:hover {
          transform: translateY(-2px);
          border-color: #C99A32;
          background: #FFFFFF;
          box-shadow: 0 6px 18px rgba(85, 0, 10, 0.08);
        }

        .cat-card-btn:focus-visible {
          border-color: #55000A;
          box-shadow: 0 0 0 3px rgba(85, 0, 10, 0.2);
        }

        .cat-card-btn--active {
          background: #55000A !important;
          border-color: #55000A !important;
          box-shadow: 0 6px 20px rgba(85, 0, 10, 0.28) !important;
          transform: translateY(-2px);
        }

        .cat-card-img-wrap {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          overflow: hidden;
          background: #F4ECE0;
          flex-shrink: 0;
          border: 1px solid rgba(200, 154, 61, 0.22);
          position: relative;
        }

        .cat-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease;
        }

        .cat-card-btn:hover .cat-card-img {
          transform: scale(1.08);
        }

        .cat-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cat-card-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #34211D;
          white-space: nowrap;
          transition: color 0.18s ease;
        }

        .cat-card-btn--active .cat-card-title {
          color: #FFF8EC !important;
        }

        .cat-card-count {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 10.5px;
          font-weight: 500;
          color: #8C756B;
          letter-spacing: 0.01em;
          transition: color 0.18s ease;
        }

        .cat-card-btn--active .cat-card-count {
          color: #D4AA45 !important;
        }

        /* Subtle scroll navigation indicators for desktop */
        .cat-row-nav-btn {
          position: absolute;
          top: calc(50% - 4px);
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFFDF9;
          border: 1.5px solid rgba(200, 154, 61, 0.35);
          color: #55000A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(85, 0, 10, 0.12);
          z-index: 10;
          transition: all 0.18s ease;
          opacity: 0.92;
        }

        .cat-row-nav-btn:hover {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
          transform: translateY(-50%) scale(1.08);
          opacity: 1;
        }

        .cat-row-nav-btn--left {
          left: -14px;
        }

        .cat-row-nav-btn--right {
          right: -14px;
        }

        @media (max-width: 768px) {
          .cat-row-nav-btn {
            display: none;
          }
          .cat-row-wrapper {
            margin-bottom: 20px;
          }
          .cat-row-scroll-container {
            gap: 10px;
            padding: 4px 2px 10px;
          }
          .cat-card-btn {
            padding: 6px 14px 6px 6px;
            border-radius: 14px;
          }
          .cat-card-img-wrap {
            width: 38px;
            height: 38px;
            border-radius: 10px;
          }
          .cat-card-title {
            font-size: 11px;
          }
          .cat-card-count {
            font-size: 9.5px;
          }
        }
      `}</style>

      {/* Left Scroll Button for Desktop */}
      <button
        type="button"
        className="cat-row-nav-btn cat-row-nav-btn--left"
        onClick={() => handleScroll('left')}
        aria-label="Scroll categories left"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Scrollable Categories List */}
      <div className="cat-row-scroll-container" ref={scrollContainerRef} role="tablist">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          const displayTitle = CATEGORY_DISPLAY_TITLES[cat.id] || cat.shortLabel?.toUpperCase() || cat.label?.toUpperCase();
          const imageUrl = CATEGORY_IMAGES[cat.id] || '/mishtichaat/chaat-plate.jpg';
          const count = categoryCounts[cat.id];

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`cat-card-btn ${isActive ? 'cat-card-btn--active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <div className="cat-card-img-wrap">
                <img
                  src={imageUrl}
                  alt={cat.label}
                  className="cat-card-img"
                  loading="eager"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = '/mishtichaat/chaat-plate.jpg';
                  }}
                />
              </div>
              <div className="cat-card-info">
                <span className="cat-card-title">{displayTitle}</span>
                {count !== undefined && count > 0 && (
                  <span className="cat-card-count">{count} items</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Right Scroll Button for Desktop */}
      <button
        type="button"
        className="cat-row-nav-btn cat-row-nav-btn--right"
        onClick={() => handleScroll('right')}
        aria-label="Scroll categories right"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
