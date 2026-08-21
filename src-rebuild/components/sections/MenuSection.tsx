import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MENU_CATEGORIES, ACTIVE_MENU, type MenuCategory } from '../../data/menu';
import { EVENTS } from '../../lib/events';

// ── Search highlight ──────────────────────────────────────────────────────────

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(re).map((p, i) =>
    re.test(p) ? <mark key={i} className="mn-mark">{p}</mark> : p
  );
}

// ── Dish row ──────────────────────────────────────────────────────────────────

function DishRow({
  item, query, last,
}: { item: typeof ACTIVE_MENU[0]; query: string; last: boolean }) {
  return (
    <div className={`mn-dish${last ? ' mn-dish--last' : ''}`} role="listitem">
      <div className="mn-dish-top">
        <h4 className="mn-dish-name">{highlight(item.name, query)}</h4>
        {item.serving && <span className="mn-dish-serving">{item.serving}</span>}
      </div>
      {item.description && (
        <p className="mn-dish-desc">{highlight(item.description, query)}</p>
      )}
    </div>
  );
}

// ── Category chapter ──────────────────────────────────────────────────────────

function CategoryChapter({
  cat, items, query,
}: { cat: MenuCategory; items: typeof ACTIVE_MENU; query: string }) {
  return (
    <article id={`menu-cat-${cat.id}`} className="mn-chapter" aria-label={cat.label}>

      {/* Compact chapter header */}
      <header className="mn-chapter-head">
        <div className="mn-chapter-top">
          <div className="mn-chapter-left">
            <p className="mn-chapter-eyebrow">{cat.label}</p>
            <h3 className="mn-chapter-title">{cat.subtitle}</h3>
          </div>
          <div className="mn-chapter-right">
            {cat.timing && (
              <span className="mn-chapter-timing">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" stroke="#C99A32" strokeWidth="1.2"/>
                  <path d="M6 3v3l1.8 1.1" stroke="#C99A32" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {cat.timing}
              </span>
            )}
            <span className="mn-chapter-count">{items.length} dishes</span>
          </div>
        </div>
        <div className="mn-chapter-rule" aria-hidden="true" />
      </header>

      {/* Two-column dish grid */}
      <div className="mn-dishes" role="list">
        {items.map((item, i) => (
          <DishRow
            key={item.id}
            item={item}
            query={query}
            last={i === items.length - 1}
          />
        ))}
      </div>
    </article>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mn-empty" role="status">
      <div className="mn-empty-ornament" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <ellipse key={deg} cx="16" cy="16" rx="3" ry="7"
              fill="rgba(201,154,50,0.35)" transform={`rotate(${deg} 16 16)`} />
          ))}
          <circle cx="16" cy="16" r="4" fill="rgba(201,154,50,0.50)" />
        </svg>
      </div>
      <p className="mn-empty-heading">No dishes found</p>
      <p className="mn-empty-sub">Try a different word, or</p>
      <button className="mn-empty-btn" onClick={onClear}>Browse all categories</button>
    </div>
  );
}

// ── Category pill ─────────────────────────────────────────────────────────────

function CatPill({
  catId, label, count, active, onClick,
}: { catId: string; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      data-cat={catId}
      role="tab"
      aria-selected={active}
      className={`mn-pill${active ? ' mn-pill--active' : ''}`}
      onClick={onClick}
    >
      {label}
      <span className="mn-pill-count">{count}</span>
    </button>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function MenuSection() {
  const [query,    setQuery]    = useState('');
  const [spyCat,   setSpyCat]   = useState(MENU_CATEGORIES[0]?.id ?? '');
  const [atBottom, setAtBottom] = useState(false);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const pillsRef   = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const isSearching = query.trim().length > 0;

  // ── Scroll panel to a category ──
  const scrollToCategory = useCallback((catId: string) => {
    const panel = scrollRef.current;
    const el    = document.getElementById(`menu-cat-${catId}`);
    if (!panel || !el) return;
    const panelTop = panel.getBoundingClientRect().top;
    const elTop    = el.getBoundingClientRect().top;
    panel.scrollBy({ top: elTop - panelTop - 16, behavior: 'smooth' });
  }, []);

  // ── External category event (from heritage cards / CTAs) ──
  useEffect(() => {
    const handler = (e: Event) => {
      const catId = (e as CustomEvent<string>).detail;
      setQuery('');
      setTimeout(() => {
        const menuEl = document.getElementById('menu');
        if (menuEl) {
          const top = menuEl.getBoundingClientRect().top + window.scrollY - 68 - 8;
          window.scrollTo({ top, behavior: 'smooth' });
        }
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
          setTimeout(() => scrollToCategory(catId), 200);
        }, 420);
      }, 80);
    };
    window.addEventListener(EVENTS.MENU_CATEGORY, handler);
    return () => window.removeEventListener(EVENTS.MENU_CATEGORY, handler);
  }, [scrollToCategory]);

  // ── Panel scrollspy ──
  const handlePanelScroll = useCallback(() => {
    const panel = scrollRef.current;
    if (!panel) return;
    // atBottom
    setAtBottom(panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 40);
    // spyCat
    if (isSearching) return;
    const panelTop = panel.getBoundingClientRect().top;
    for (const cat of [...MENU_CATEGORIES].reverse()) {
      const el = document.getElementById(`menu-cat-${cat.id}`);
      if (!el) continue;
      if (el.getBoundingClientRect().top - panelTop <= 48) {
        setSpyCat(cat.id);
        return;
      }
    }
    setSpyCat(MENU_CATEGORIES[0]?.id ?? '');
  }, [isSearching]);

  // ── Scroll active pill into view (horizontal only within pills container) ──
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const pillsEl = pillsRef.current;
    if (!pillsEl || isSearching) return;
    const wrap = pillsEl.parentElement;
    if (!wrap) return;

    const btn = pillsEl.querySelector(
      `[data-cat="${spyCat}"]`
    ) as HTMLElement | null;
    if (!btn) return;

    const wrapRect = wrap.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const currentScroll = wrap.scrollLeft;
    const targetScroll = currentScroll + (btnRect.left - wrapRect.left) - (wrap.clientWidth / 2) + (btn.offsetWidth / 2);

    wrap.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth',
    });
  }, [spyCat, isSearching]);

  // ── Reset panel scroll when query changes ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
    setAtBottom(false);
  }, [query]);

  // ── Check atBottom after content change ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 40);
    }, 60);
    return () => clearTimeout(t);
  }, [query]);

  // ── Filtered data ──
  const filteredItems = useMemo(() => {
    if (!query.trim()) return ACTIVE_MENU;
    const q = query.trim().toLowerCase();
    return ACTIVE_MENU.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.keywords.some(k => k.includes(q))
    );
  }, [query]);

  const countByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of ACTIVE_MENU) map[item.category] = (map[item.category] ?? 0) + 1;
    return map;
  }, []);

  const sections = useMemo(() => {
    const grouped: Array<{ cat: MenuCategory; items: typeof ACTIVE_MENU }> = [];
    for (const cat of MENU_CATEGORIES) {
      const items = filteredItems.filter(i => i.category === cat.id);
      if (items.length > 0) grouped.push({ cat, items });
    }
    return grouped;
  }, [filteredItems]);

  // ── Continue to next section ──
  function handleContinue() {
    const next = sectionRef.current?.nextElementSibling as HTMLElement | null;
    if (next) {
      const top = next.getBoundingClientRect().top + window.scrollY - 68 - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  return (
    <section id="menu" ref={sectionRef} aria-label="Our Menu" style={{ scrollMarginTop: '68px' }}>
      <style>{`

        /* ═══════════════════════════════════════════════════════
           MENU SECTION — Panel layout
           Prefix: mn-
        ═══════════════════════════════════════════════════════ */

        /* ── Section shell ────────────────────────────────── */
        #menu { background: #55000A; padding: 0; }

        /* ── Maroon intro ─────────────────────────────────── */
        #menu .mn-intro {
          background: #55000A;
          padding: clamp(44px, 4.5vw, 64px) clamp(20px, 4vw, 48px)
                   clamp(36px, 3.8vw, 52px);
          border-radius: 0 0 24px 24px;
          box-shadow: 0 10px 32px rgba(25,0,5,0.26);
          text-align: center;
          position: relative; z-index: 1;
        }
        #menu .mn-intro-eyebrow {
          display: block;
          font-family: Inter, sans-serif;
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: #D4AA45; margin-bottom: 12px;
        }
        #menu .mn-intro-h2 {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(34px, 4.2vw, 56px);
          font-weight: 700; line-height: 1.08;
          color: #FFF8EC; margin: 0 0 10px;
          letter-spacing: -0.015em;
        }
        #menu .mn-intro-sub {
          font-family: Inter, sans-serif;
          font-size: clamp(13px, 1vw, 16px);
          color: rgba(255,248,236,0.62); line-height: 1.65;
          margin: 0 auto; max-width: 520px;
        }

        /* ── Cream body ───────────────────────────────────── */
        #menu .mn-body {
          background: #F5EAD8;
          padding: clamp(28px, 3.5vw, 44px) clamp(16px, 3vw, 40px)
                   clamp(36px, 4.5vw, 56px);
        }
        #menu .mn-body-inner {
          max-width: 1260px;
          margin-inline: auto;
        }

        /* ── Panel ────────────────────────────────────────── */
        #menu .mn-panel {
          background: #FDFAF4;
          border: 1px solid rgba(201,154,50,0.26);
          border-radius: 20px;
          box-shadow:
            0 2px 8px rgba(85,0,10,0.04),
            0 10px 36px rgba(85,0,10,0.09),
            inset 0 1px 0 rgba(255,255,255,0.72);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* ── Controls (sits above scroll area, not inside it) */
        #menu .mn-controls {
          background: #FDFAF4;
          border-bottom: 1px solid rgba(201,154,50,0.16);
          padding: 16px 24px 0;
          flex-shrink: 0;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        /* Search row */
        #menu .mn-ctrl-search-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        #menu .mn-search-wrap {
          position: relative;
          flex: 0 0 clamp(180px, 28vw, 300px);
        }
        #menu .mn-search-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: #C99A32; pointer-events: none; line-height: 0;
        }
        #menu .mn-search {
          width: 100%; box-sizing: border-box;
          background: #FFFDF8;
          border: 1.5px solid rgba(201,154,50,0.30);
          border-radius: 999px;
          padding: 9px 38px 9px 38px;
          font-family: Inter, sans-serif;
          font-size: 13px; color: #3D2A25;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        #menu .mn-search:focus {
          border-color: #C99A32;
          box-shadow: 0 0 0 3px rgba(201,154,50,0.13);
        }
        #menu .mn-search::placeholder { color: #B09989; }
        #menu .mn-search-clear {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #B09989; padding: 4px; line-height: 0;
          border-radius: 50%; transition: color 0.14s;
        }
        #menu .mn-search-clear:hover { color: #55000A; }

        /* Result info (shown when searching) */
        #menu .mn-result-info {
          font-family: Inter, sans-serif;
          font-size: 12.5px; color: #9A8078;
        }
        #menu .mn-result-info strong { color: #55000A; font-weight: 700; }
        #menu .mn-result-info em { font-style: italic; }
        #menu .mn-result-clear {
          background: none; border: none; cursor: pointer;
          font-family: Inter, sans-serif; font-size: 12px; font-weight: 700;
          color: #C99A32; text-decoration: underline; text-underline-offset: 2px;
          margin-left: 8px; padding: 0;
        }

        /* Pills row */
        #menu .mn-pills-wrap {
          overflow-x: auto;
          scrollbar-width: none; -ms-overflow-style: none;
          padding-bottom: 14px;
        }
        #menu .mn-pills-wrap::-webkit-scrollbar { display: none; }
        #menu .mn-pills {
          display: flex; gap: 6px;
          min-width: max-content;
        }

        /* Individual pill */
        .mn-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px;
          border: none; border-radius: 999px;
          background: rgba(85,0,10,0.07);
          color: #55000A;
          font-family: Inter, sans-serif;
          font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          transition: background 0.17s, color 0.17s, box-shadow 0.17s;
        }
        .mn-pill:hover { background: rgba(85,0,10,0.13); }
        .mn-pill--active {
          background: #55000A; color: #FFF8EC;
          box-shadow: 0 4px 12px rgba(85,0,10,0.22);
        }
        .mn-pill--active:hover { background: #6B000D; }
        .mn-pill:focus-visible { outline: 2px solid #C99A32; outline-offset: 2px; }
        .mn-pill-count {
          font-size: 9.5px; font-weight: 600;
          opacity: 0.55; letter-spacing: 0;
        }
        .mn-pill--active .mn-pill-count { opacity: 0.72; }

        /* ── Scrollable content area ──────────────────────── */
        #menu .mn-scroll {
          overflow-y: auto;
          overflow-x: hidden;
          height: clamp(460px, 70vh, 760px);
          padding: 24px 28px 24px;
          -webkit-overflow-scrolling: touch;
          outline: none;
          /* Theme scrollbar */
          scrollbar-width: thin;
          scrollbar-color: rgba(201,154,50,0.42) transparent;
        }
        #menu .mn-scroll::-webkit-scrollbar { width: 5px; }
        #menu .mn-scroll::-webkit-scrollbar-track { background: transparent; border-radius: 4px; }
        #menu .mn-scroll::-webkit-scrollbar-thumb {
          background: rgba(201,154,50,0.38); border-radius: 4px;
        }
        #menu .mn-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(201,154,50,0.64);
        }
        #menu .mn-scroll:focus-visible {
          box-shadow: inset 0 0 0 2px rgba(201,154,50,0.42);
        }

        /* ── Bottom fade cue ──────────────────────────────── */
        #menu .mn-fade {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 68px;
          background: linear-gradient(to top, #FDFAF4 25%, rgba(253,250,244,0));
          pointer-events: none; z-index: 6;
          border-radius: 0 0 20px 20px;
          transition: opacity 0.32s ease;
        }
        #menu .mn-fade--hidden { opacity: 0; }

        /* ── Category chapter ─────────────────────────────── */
        .mn-chapter {
          margin-bottom: 32px;
          padding-bottom: 8px;
        }
        .mn-chapter:last-of-type { margin-bottom: 0; }

        /* Chapter header */
        .mn-chapter-head { margin-bottom: 10px; }
        .mn-chapter-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .mn-chapter-left { flex: 1; min-width: 0; }
        .mn-chapter-eyebrow {
          font-family: Inter, sans-serif;
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.24em; text-transform: uppercase;
          color: #C99A32; margin: 0 0 3px;
        }
        .mn-chapter-title {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(20px, 2vw, 26px);
          font-weight: 700; line-height: 1.15;
          color: #34211D; margin: 0;
          letter-spacing: -0.01em;
        }
        .mn-chapter-right {
          display: flex; flex-direction: column;
          align-items: flex-end; gap: 4px;
          flex-shrink: 0;
        }
        .mn-chapter-timing {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: Inter, sans-serif;
          font-size: 11px; font-weight: 600;
          color: #9A8078;
          background: rgba(201,154,50,0.09);
          border: 1px solid rgba(201,154,50,0.20);
          border-radius: 999px; padding: 3px 10px;
          white-space: nowrap;
        }
        .mn-chapter-count {
          font-family: Inter, sans-serif;
          font-size: 10.5px; color: #B09989;
          letter-spacing: 0.03em;
        }
        .mn-chapter-rule {
          height: 1px;
          background: linear-gradient(90deg, rgba(201,154,50,0.50) 0%, rgba(201,154,50,0.08) 100%);
          border-radius: 1px;
        }

        /* ── Dish grid (2-col on desktop) ─────────────────── */
        .mn-dishes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 36px;
          margin-top: 4px;
        }

        /* ── Dish row ─────────────────────────────────────── */
        .mn-dish {
          padding: 13px 0;
          border-bottom: 1px solid rgba(201,154,50,0.16);
        }
        .mn-dish--last { border-bottom: none; }
        /* In 2-col grid, the last of left col may not be truly last,
           so keep consistent border and just fade the final pair via chapter margin */

        .mn-dish-top {
          display: flex; align-items: baseline;
          gap: 8px; margin-bottom: 3px; flex-wrap: wrap;
        }
        .mn-dish-name {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
          font-size: clamp(15px, 1.4vw, 18px);
          font-weight: 600; color: #2A1A16;
          margin: 0; line-height: 1.2;
          letter-spacing: -0.005em;
        }
        .mn-dish-serving {
          font-family: Inter, sans-serif;
          font-size: 10.5px; font-weight: 600;
          color: #B09989;
          background: rgba(201,154,50,0.09);
          border-radius: 999px; padding: 1px 8px;
          white-space: nowrap; flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .mn-dish-desc {
          font-family: Inter, sans-serif;
          font-size: clamp(12px, 0.95vw, 13.5px);
          line-height: 1.60; color: #6B5248; margin: 0;
        }

        /* ── Search mark ──────────────────────────────────── */
        .mn-mark {
          background: rgba(201,154,50,0.28);
          border-radius: 2px; padding: 0 1px; color: inherit;
        }

        /* ── Empty state ──────────────────────────────────── */
        .mn-empty {
          text-align: center;
          padding: clamp(44px, 6vw, 72px) 24px;
        }
        .mn-empty-ornament {
          display: flex; justify-content: center;
          margin-bottom: 16px; opacity: 0.6;
        }
        .mn-empty-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(22px, 2.2vw, 28px);
          font-weight: 600; color: #55000A;
          margin: 0 0 6px;
        }
        .mn-empty-sub {
          font-family: Inter, sans-serif;
          font-size: 13.5px; color: #9A8078; margin: 0 0 14px;
        }
        .mn-empty-btn {
          display: inline-flex; align-items: center;
          height: 40px; padding: 0 22px;
          border: 1.5px solid #C99A32; border-radius: 999px;
          background: transparent; color: #55000A;
          font-family: Inter, sans-serif;
          font-size: 11.5px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
        }
        .mn-empty-btn:hover { background: #55000A; color: #FFF8EC; border-color: #55000A; }
        .mn-empty-btn:focus-visible { outline: 2px solid #C99A32; outline-offset: 3px; }

        /* ── Continue CTA ─────────────────────────────────── */
        #menu .mn-continue-wrap {
          display: flex; justify-content: center;
          margin-top: 20px;
        }
        #menu .mn-continue-btn {
          display: inline-flex; align-items: center; gap: 9px;
          height: 44px; padding: 0 26px;
          border-radius: 999px;
          border: 1.5px solid rgba(85,0,10,0.22);
          background: transparent; color: #55000A;
          font-family: Inter, sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s;
        }
        #menu .mn-continue-btn:hover {
          background: #55000A; border-color: #55000A; color: #FFF8EC;
          transform: translateY(-2px);
        }
        #menu .mn-continue-btn:focus-visible { outline: 2px solid #C99A32; outline-offset: 3px; }

        /* ═══════════════════════════════════════════════════
           TABLET  768–1099px  →  keep 2-col but smaller
        ═══════════════════════════════════════════════════ */
        @media (min-width: 768px) and (max-width: 1099px) {
          .mn-dishes { column-gap: 24px; }
          #menu .mn-scroll { padding: 20px 20px 20px; }
          #menu .mn-controls { padding: 14px 20px 0; }
        }

        /* ═══════════════════════════════════════════════════
           MOBILE  ≤ 767px  →  single column
        ═══════════════════════════════════════════════════ */
        @media (max-width: 767px) {
          #menu .mn-intro { padding: 40px 20px 32px; border-radius: 0 0 18px 18px; }
          #menu .mn-body  { padding: 18px 12px 36px; }

          #menu .mn-controls { padding: 12px 14px 0; }
          #menu .mn-ctrl-search-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            margin-bottom: 10px;
          }
          #menu .mn-search-wrap { flex: none; width: 100%; }
          #menu .mn-result-info { font-size: 12px; }

          #menu .mn-scroll {
            height: clamp(380px, 66vh, 580px);
            padding: 16px 14px 16px;
          }
          #menu .mn-panel { border-radius: 14px; }
          #menu .mn-fade  { height: 52px; }

          /* Single column dishes on mobile */
          .mn-dishes { grid-template-columns: 1fr; column-gap: 0; }
          /* On mobile every item should show border (can't know which is last in single col) */
          .mn-dish--last { border-bottom: 1px solid rgba(201,154,50,0.16); }
          .mn-chapter:last-of-type .mn-dish--last { border-bottom: none; }

          .mn-chapter-top { flex-direction: column; gap: 6px; }
          .mn-chapter-right { align-items: flex-start; flex-direction: row; flex-wrap: wrap; gap: 6px; }
          .mn-chapter-title { font-size: clamp(18px, 5vw, 22px); }
        }

        /* ═══════════════════════════════════════════════════
           VERY SMALL  ≤ 380px
        ═══════════════════════════════════════════════════ */
        @media (max-width: 380px) {
          #menu .mn-intro-h2 { font-size: 30px; }
          #menu .mn-body { padding: 14px 8px 28px; }
          #menu .mn-scroll { padding: 12px 12px 12px; }
        }

        /* ── Reduced motion ───────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .mn-pill, .mn-dish, .mn-empty-btn,
          #menu .mn-continue-btn, #menu .mn-search,
          #menu .mn-fade { transition: none !important; }
        }

      `}</style>

      {/* ── Maroon intro ── */}
      <div className="mn-intro">
        <span className="mn-intro-eyebrow">Our Menu</span>
        <h2 className="mn-intro-h2">
          From the Heart<br />of Malwa
        </h2>
        <p className="mn-intro-sub">
          Every specialty draws from the rich culinary traditions of Ujjain —
          prepared with authentic spices and served with warmth.
        </p>
      </div>

      {/* ── Cream body ── */}
      <div className="mn-body">
        <div className="mn-body-inner">

          {/* ── Panel ── */}
          <div className="mn-panel">

            {/* Controls — always visible, above scroll area */}
            <div className="mn-controls">

              {/* Row: search + result info */}
              <div className="mn-ctrl-search-row">
                <div className="mn-search-wrap">
                  <span className="mn-search-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="search"
                    className="mn-search"
                    placeholder="Search dishes…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    aria-label="Search menu items"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      className="mn-search-clear"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>

                {isSearching && (
                  <p className="mn-result-info" aria-live="polite" aria-atomic="true">
                    {filteredItems.length === 0
                      ? <>No results for <em>"{query}"</em></>
                      : <><strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'dish' : 'dishes'} for <em>"{query}"</em></>
                    }
                    <button className="mn-result-clear" onClick={() => setQuery('')}>Clear</button>
                  </p>
                )}
              </div>

              {/* Category pills */}
              <div className="mn-pills-wrap">
                <div className="mn-pills" ref={pillsRef} role="tablist" aria-label="Filter by category">
                  {MENU_CATEGORIES.map(cat => (
                    <CatPill
                      key={cat.id}
                      catId={cat.id}
                      label={cat.label}
                      count={countByCategory[cat.id] ?? 0}
                      active={!isSearching && spyCat === cat.id}
                      onClick={() => {
                        setQuery('');
                        setTimeout(() => scrollToCategory(cat.id), 50);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable menu content */}
            <div
              ref={scrollRef}
              className="mn-scroll"
              onScroll={handlePanelScroll}
              tabIndex={0}
              role="region"
              aria-label="Menu items — scroll to explore"
            >
              {sections.length === 0 ? (
                <EmptyState onClear={() => setQuery('')} />
              ) : (
                sections.map(({ cat, items }) => (
                  <CategoryChapter key={cat.id} cat={cat} items={items} query={query} />
                ))
              )}
            </div>

            {/* Bottom fade cue */}
            <div
              className={`mn-fade${atBottom ? ' mn-fade--hidden' : ''}`}
              aria-hidden="true"
            />
          </div>

          {/* Continue CTA */}
          <div className="mn-continue-wrap">
            <button
              className="mn-continue-btn"
              onClick={handleContinue}
              aria-label="Continue to next section"
            >
              Continue Exploring
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}
