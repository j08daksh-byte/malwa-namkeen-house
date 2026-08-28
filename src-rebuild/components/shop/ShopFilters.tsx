import React, { useState, useEffect } from 'react';
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
  onResetAll?: () => void;
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
  onResetAll,
}: ShopFiltersProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const categoriesList = categories && categories.length > 0 ? categories : SHOP_CATEGORIES;

  // Calculate active filter count
  const activeFiltersCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedSpice !== 'All' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterDrawerOpen(false);
    };
    if (isFilterDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isFilterDrawerOpen]);

  const handleReset = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      onSelectCategory('all');
      onSelectSpice('All');
      onSearchChange('');
      onSortChange('featured');
    }
    setIsFilterDrawerOpen(false);
  };

  return (
    <section className="eb-controls-wrapper" aria-label="Search, Filters and Sorting">
      <style>{`
        .eb-controls-wrapper {
          margin-bottom: 24px;
        }

        /* ── Main Controls Bar ───────────────────────────────── */
        .eb-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding: 10px 0;
        }

        .eb-controls-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1 1 320px;
          min-width: 0;
        }

        /* FILTERS Button */
        .eb-filter-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 18px;
          background: #FFFDF9;
          border: 1.5px solid rgba(200, 154, 61, 0.35);
          border-radius: 999px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #34211D;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.03);
          flex-shrink: 0;
          outline: none;
        }

        .eb-filter-trigger-btn:hover {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
          transform: translateY(-1px);
        }

        .eb-filter-trigger-btn--active {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
        }

        .eb-filter-badge-count {
          background: #D4AA45;
          color: #55000A;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Search Input */
        .eb-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1 1 200px;
          min-width: 140px;
        }

        .eb-search-icon {
          position: absolute;
          left: 14px;
          color: #C99A32;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .eb-search-input {
          width: 100%;
          height: 42px;
          background: #FFFDF9;
          border: 1.5px solid rgba(200, 154, 61, 0.30);
          border-radius: 999px;
          padding: 0 36px 0 40px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 13px;
          color: #34211D;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }

        .eb-search-input:focus {
          border-color: #55000A;
          box-shadow: 0 0 0 3px rgba(85, 0, 10, 0.12);
        }

        .eb-search-input::placeholder {
          color: #9C8980;
        }

        .eb-search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #9C8980;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .eb-search-clear:hover {
          color: #55000A;
        }

        /* ── Controls Right ─────────────────────────────────── */
        .eb-controls-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .eb-sort-select-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        /* SORT BY Dropdown */
        .eb-sort-select {
          background: #FFFDF9;
          border: 1.5px solid rgba(200, 154, 61, 0.35);
          border-radius: 999px;
          height: 42px;
          padding: 0 36px 0 16px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #34211D;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2355000A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.03);
        }

        .eb-sort-select:hover {
          border-color: #55000A;
        }

        .eb-sort-select:focus {
          border-color: #55000A;
          box-shadow: 0 0 0 3px rgba(85, 0, 10, 0.12);
        }

        /* ── Active Filter Chips Row ────────────────────────── */
        .eb-active-chips-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
          padding-top: 6px;
        }

        .eb-active-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #55000A;
          color: #FFF8EC;
          border-radius: 999px;
          padding: 5px 12px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.15);
        }

        .eb-active-chip-remove {
          background: none;
          border: none;
          color: #D4AA45;
          cursor: pointer;
          padding: 0 0 0 4px;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          line-height: 1;
          transition: color 0.15s;
        }

        .eb-active-chip-remove:hover {
          color: #FFFFFF;
        }

        .eb-clear-all-btn {
          background: #FAF5EB;
          border: 1px solid rgba(200, 154, 61, 0.35);
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border-radius: 999px;
          cursor: pointer;
          padding: 5px 12px;
          transition: all 0.15s ease;
        }

        .eb-clear-all-btn:hover {
          background: #55000A;
          color: #FFF8EC;
          border-color: #55000A;
        }

        .eb-results-count {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 500;
          color: #8C756B;
          margin-left: auto;
        }

        /* ── Filter Slide-out Drawer / Modal ────────────────── */
        .eb-filter-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(35, 3, 10, 0.65);
          backdrop-filter: blur(4px);
          z-index: 500;
          display: flex;
          justify-content: flex-start;
          animation: ebFadeIn 0.2s ease;
        }

        @keyframes ebFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .eb-filter-drawer {
          background: #FDFAF4;
          width: 100%;
          max-width: 380px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.25);
          animation: ebSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border-right: 1.5px solid rgba(200, 154, 61, 0.35);
        }

        @keyframes ebSlideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        .eb-drawer-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(200, 154, 61, 0.20);
        }

        .eb-drawer-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #55000A;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .eb-drawer-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #FFFDF9;
          border: 1px solid rgba(200, 154, 61, 0.3);
          color: #55000A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.15s;
        }

        .eb-drawer-close:hover {
          background: #55000A;
          color: #FFF8EC;
        }

        .eb-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .eb-drawer-section-title {
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #55000A;
          margin: 0 0 12px;
        }

        .eb-drawer-pill-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .eb-drawer-pill-btn {
          padding: 8px 14px;
          border-radius: 999px;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 600;
          border: 1.5px solid rgba(200, 154, 61, 0.30);
          background: #FFFDF9;
          color: #34211D;
          cursor: pointer;
          transition: all 0.15s;
        }

        .eb-drawer-pill-btn:hover {
          border-color: #55000A;
          background: #FAF5EB;
        }

        .eb-drawer-pill-btn--active {
          background: #55000A !important;
          color: #FFF8EC !important;
          border-color: #55000A !important;
          box-shadow: 0 2px 8px rgba(85, 0, 10, 0.2);
        }

        .eb-drawer-footer {
          padding: 18px 24px;
          border-top: 1px solid rgba(200, 154, 61, 0.20);
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFFDF9;
        }

        .eb-drawer-reset-btn {
          flex: 1;
          height: 44px;
          border-radius: 10px;
          background: #F3ECE0;
          border: 1px solid rgba(200, 154, 61, 0.3);
          color: #55000A;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.15s;
        }

        .eb-drawer-reset-btn:hover {
          background: #E8DDCE;
        }

        .eb-drawer-apply-btn {
          flex: 1.5;
          height: 44px;
          border-radius: 10px;
          background: #55000A;
          border: 1px solid #55000A;
          color: #FFF8EC;
          font-family: var(--font-primary, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(85, 0, 10, 0.2);
          transition: background 0.15s;
        }

        .eb-drawer-apply-btn:hover {
          background: #6B000D;
        }

        @media (max-width: 640px) {
          .eb-controls-bar {
            gap: 8px;
          }
          .eb-filter-trigger-btn {
            height: 38px;
            padding: 0 14px;
            font-size: 10.5px;
          }
          .eb-search-input {
            height: 38px;
            font-size: 12px;
          }
          .eb-sort-select {
            height: 38px;
            font-size: 10.5px;
            padding: 0 30px 0 12px;
          }
          .eb-filter-drawer {
            max-width: 100%;
          }
        }
      `}</style>

      {/* Main Row: FILTERS Trigger + Search + SORT BY */}
      <div className="eb-controls-bar">
        <div className="eb-controls-left">
          {/* FILTERS Button */}
          <button
            type="button"
            className={`eb-filter-trigger-btn ${activeFiltersCount > 0 ? 'eb-filter-trigger-btn--active' : ''}`}
            onClick={() => setIsFilterDrawerOpen(true)}
            aria-expanded={isFilterDrawerOpen}
            aria-label="Open product filters"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>FILTERS</span>
            {activeFiltersCount > 0 && (
              <span className="eb-filter-badge-count">{activeFiltersCount}</span>
            )}
          </button>

          {/* Search Bar */}
          <div className="eb-search-wrap">
            <span className="eb-search-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search Ratlami Sev, Mathri, Sweets..."
              className="eb-search-input"
              aria-label="Search delicacies"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="eb-search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: SORT BY */}
        <div className="eb-controls-right">
          <div className="eb-sort-select-wrap">
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
              className="eb-sort-select"
              aria-label="Sort delicacies by"
            >
              <option value="featured">SORT BY: FEATURED</option>
              <option value="price-asc">PRICE: LOW TO HIGH</option>
              <option value="price-desc">PRICE: HIGH TO LOW</option>
              <option value="rating">TOP RATED</option>
              <option value="name-asc">ALPHABETICAL: A TO Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedCategory !== 'all' || selectedSpice !== 'All' || searchQuery.trim()) && (
        <div className="eb-active-chips-row">
          {selectedCategory !== 'all' && (
            <span className="eb-active-chip">
              Category: {categoriesList.find(c => c.id === selectedCategory)?.shortLabel || selectedCategory}
              <button
                type="button"
                className="eb-active-chip-remove"
                onClick={() => onSelectCategory('all')}
                aria-label="Remove category filter"
              >
                ✕
              </button>
            </span>
          )}

          {selectedSpice !== 'All' && (
            <span className="eb-active-chip">
              Taste: {selectedSpice}
              <button
                type="button"
                className="eb-active-chip-remove"
                onClick={() => onSelectSpice('All')}
                aria-label="Remove spice filter"
              >
                ✕
              </button>
            </span>
          )}

          {searchQuery.trim() && (
            <span className="eb-active-chip">
              "{searchQuery.trim()}"
              <button
                type="button"
                className="eb-active-chip-remove"
                onClick={() => onSearchChange('')}
                aria-label="Remove search filter"
              >
                ✕
              </button>
            </span>
          )}

          <button
            type="button"
            className="eb-clear-all-btn"
            onClick={handleReset}
          >
            Clear All
          </button>

          <span className="eb-results-count">
            {totalResults} {totalResults === 1 ? 'delicacy' : 'delicacies'} found
          </span>
        </div>
      )}

      {/* Filter Slide-out Drawer */}
      {isFilterDrawerOpen && (
        <div
          className="eb-filter-drawer-overlay"
          onClick={() => setIsFilterDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Filter delicacies"
        >
          <div
            className="eb-filter-drawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="eb-drawer-header">
              <h2 className="eb-drawer-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                Filter Delicacies
              </h2>
              <button
                type="button"
                className="eb-drawer-close"
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className="eb-drawer-body">
              {/* Category Filter */}
              <div>
                <h3 className="eb-drawer-section-title">Categories</h3>
                <div className="eb-drawer-pill-group">
                  {categoriesList.map(cat => {
                    const isActive = selectedCategory === cat.id;
                    const count = categoryCounts[cat.id];
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`eb-drawer-pill-btn ${isActive ? 'eb-drawer-pill-btn--active' : ''}`}
                        onClick={() => onSelectCategory(cat.id)}
                      >
                        {cat.label || cat.shortLabel} {count ? `(${count})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spice / Flavour Profile Filter */}
              <div>
                <h3 className="eb-drawer-section-title">Spice &amp; Flavour</h3>
                <div className="eb-drawer-pill-group">
                  {SPICE_LEVELS.map(spice => {
                    const isActive = selectedSpice === spice;
                    return (
                      <button
                        key={spice}
                        type="button"
                        className={`eb-drawer-pill-btn ${isActive ? 'eb-drawer-pill-btn--active' : ''}`}
                        onClick={() => onSelectSpice(spice)}
                      >
                        {spice}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort by quick options */}
              <div>
                <h3 className="eb-drawer-section-title">Sort By</h3>
                <div className="eb-drawer-pill-group">
                  {[
                    { id: 'featured', label: 'Featured' },
                    { id: 'price-asc', label: 'Price: Low to High' },
                    { id: 'price-desc', label: 'Price: High to Low' },
                    { id: 'rating', label: 'Customer Rating' },
                    { id: 'name-asc', label: 'Alphabetical' },
                  ].map(s => {
                    const isActive = sortBy === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`eb-drawer-pill-btn ${isActive ? 'eb-drawer-pill-btn--active' : ''}`}
                        onClick={() => onSortChange(s.id)}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="eb-drawer-footer">
              <button
                type="button"
                className="eb-drawer-reset-btn"
                onClick={handleReset}
              >
                Reset All
              </button>
              <button
                type="button"
                className="eb-drawer-apply-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Show {totalResults} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
