import React from 'react';
import { SHOP_CATEGORIES, type ShopCategory } from '../../data/products';

interface ShopFiltersProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSpice: string;
  onSelectSpice: (spice: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categoryCounts: Record<string, number>;
  totalResults: number;
  categories?: ShopCategory[];
}

const SPICE_LEVELS = ['All', 'Mild', 'Medium', 'Zesty', 'Clove Hot', 'Sweet & Tangy'];

export default function ShopFilters({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedSpice,
  onSelectSpice,
  sortBy,
  onSortChange,
  categoryCounts,
  totalResults,
  categories,
}: ShopFiltersProps) {
  const categoriesList = categories && categories.length > 0 ? categories : SHOP_CATEGORIES;
  const activeCategoryObj = categoriesList.find(c => c.id === selectedCategory) ?? categoriesList[0] ?? {
    id: 'all',
    label: 'All Delicacies',
    description: 'Explore our complete heritage collection of small-batch savouries, sweets, and curated gift boxes.',
  };

  return (
    <div className="shop-filters-container">
      <style>{`
        .shop-filters-container {
          background: #FDFAF4;
          border: 1px solid rgba(201, 154, 50, 0.26);
          border-radius: 20px;
          padding: clamp(20px, 3vw, 28px);
          margin-bottom: 32px;
          box-shadow: 0 4px 18px rgba(85, 0, 10, 0.05);
        }

        .shop-filters__top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(201, 154, 50, 0.16);
        }

        /* ── Search Bar ────────────────────────────────────────── */
        .shop-filters__search-wrap {
          position: relative;
          flex: 1 1 280px;
          max-width: 420px;
        }

        .shop-filters__search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #C99A32;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .shop-filters__search-input {
          width: 100%;
          background: #FFFDF8;
          border: 1.5px solid rgba(201, 154, 50, 0.35);
          border-radius: 999px;
          padding: 10px 38px 10px 40px;
          font-family: Inter, sans-serif;
          font-size: 13.5px;
          color: #34211D;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .shop-filters__search-input:focus {
          border-color: #C99A32;
          box-shadow: 0 0 0 3px rgba(201, 154, 50, 0.15);
        }

        .shop-filters__search-input::placeholder {
          color: #A38C82;
        }

        .shop-filters__search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #A38C82;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .shop-filters__search-clear:hover {
          color: #55000A;
        }

        /* ── Controls Right ────────────────────────────────────── */
        .shop-filters__controls-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .shop-filters__sort-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shop-filters__sort-label {
          font-family: Inter, sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #75645C;
          white-space: nowrap;
        }

        .shop-filters__sort-select {
          background: #FFFDF8;
          border: 1.5px solid rgba(201, 154, 50, 0.35);
          border-radius: 999px;
          padding: 8px 32px 8px 14px;
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #34211D;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23C99A32' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          transition: border-color 0.2s;
        }

        .shop-filters__sort-select:focus {
          border-color: #C99A32;
        }

        /* ── Category Pills Row ────────────────────────────────── */
        .shop-filters__categories-scroll {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }

        .shop-filters__categories-scroll::-webkit-scrollbar {
          display: none;
        }

        .shop-filters__categories-list {
          display: flex;
          gap: 8px;
          min-width: max-content;
        }

        .shop-filters__cat-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.03em;
          border: 1px solid rgba(85, 0, 10, 0.12);
          background: rgba(85, 0, 10, 0.05);
          color: #55000A;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .shop-filters__cat-btn:hover {
          background: rgba(85, 0, 10, 0.10);
          border-color: rgba(85, 0, 10, 0.25);
        }

        .shop-filters__cat-btn--active {
          background: #55000A;
          border-color: #55000A;
          color: #FFF8EC;
          box-shadow: 0 4px 12px rgba(85, 0, 10, 0.22);
        }

        .shop-filters__cat-btn--active:hover {
          background: #6B000D;
          border-color: #6B000D;
        }

        .shop-filters__cat-count {
          font-size: 10px;
          font-weight: 600;
          opacity: 0.65;
        }

        .shop-filters__cat-btn--active .shop-filters__cat-count {
          opacity: 0.85;
          color: #D4AA45;
        }

        /* ── Spice & Taste Tags Row ────────────────────────────── */
        .shop-filters__tags-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 10px;
        }

        .shop-filters__tags-label {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #C99A32;
        }

        .shop-filters__tags-list {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .shop-filters__tag-btn {
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 11px;
          border-radius: 999px;
          border: 1px solid rgba(200, 154, 61, 0.28);
          background: #FFFDF8;
          color: #5E4940;
          cursor: pointer;
          transition: all 0.16s ease;
        }

        .shop-filters__tag-btn:hover {
          border-color: #C99A32;
          color: #34211D;
        }

        .shop-filters__tag-btn--active {
          background: #C99A32;
          border-color: #C99A32;
          color: #2C0612;
          font-weight: 700;
        }

        /* ── Active Category Info Banner ───────────────────────── */
        .shop-filters__desc-strip {
          margin-top: 18px;
          padding: 12px 18px;
          background: rgba(201, 154, 50, 0.08);
          border-left: 3px solid #C99A32;
          border-radius: 0 10px 10px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .shop-filters__desc-text {
          font-family: Inter, sans-serif;
          font-size: 12.5px;
          color: #5E4940;
          line-height: 1.5;
          margin: 0;
        }

        .shop-filters__desc-text strong {
          color: #55000A;
          font-weight: 700;
        }

        .shop-filters__result-count {
          font-family: Inter, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #55000A;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .shop-filters__top-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .shop-filters__search-wrap {
            max-width: 100%;
          }
          .shop-filters__controls-right {
            justify-content: space-between;
          }
        }
      `}</style>

      {/* Top row: Search and Sort */}
      <div className="shop-filters__top-row">
        <div className="shop-filters__search-wrap">
          <span className="shop-filters__search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            className="shop-filters__search-input"
            placeholder="Search sev, mixtures, mathri, ladoo..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Search delicacies"
          />
          {searchQuery && (
            <button
              className="shop-filters__search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="shop-filters__controls-right">
          <div className="shop-filters__sort-wrap">
            <label htmlFor="shop-sort" className="shop-filters__sort-label">Sort:</label>
            <select
              id="shop-sort"
              className="shop-filters__sort-select"
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
            >
              <option value="featured">Featured & Best</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="shop-filters__categories-scroll" role="tablist" aria-label="Product categories">
        <div className="shop-filters__categories-list">
          {categoriesList.map(cat => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                className={`shop-filters__cat-btn ${isActive ? 'shop-filters__cat-btn--active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="shop-filters__cat-count">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spice / Flavor Filter Row */}
      <div className="shop-filters__tags-row">
        <span className="shop-filters__tags-label">Flavor Profile:</span>
        <div className="shop-filters__tags-list">
          {SPICE_LEVELS.map(spice => (
            <button
              key={spice}
              className={`shop-filters__tag-btn ${selectedSpice === spice ? 'shop-filters__tag-btn--active' : ''}`}
              onClick={() => onSelectSpice(spice)}
            >
              {spice}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Category Description */}
      <div className="shop-filters__desc-strip">
        <p className="shop-filters__desc-text">
          <strong>{activeCategoryObj.label}:</strong> {activeCategoryObj.description}
        </p>
        <span className="shop-filters__result-count">
          Showing {totalResults} {totalResults === 1 ? 'delicacy' : 'delicacies'}
        </span>
      </div>
    </div>
  );
}
