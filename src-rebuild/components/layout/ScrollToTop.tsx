import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop & Anchor Manager
 * Guarantees:
 * 1. Fresh navigation to '/' or any route without hash scrolls immediately to the top (Hero).
 * 2. Navigation with a hash (e.g. /#story) smoothly scrolls to the intended section offset.
 * 3. Prevents unwanted automatic scroll jumps on first render.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // If a specific section hash is requested (e.g. #story, #menu)
    if (hash) {
      const elementId = hash.replace(/^#/, '');
      const target = document.getElementById(elementId) || document.querySelector(hash);

      if (target) {
        // Calculate offset for fixed navbar (approx 68px)
        const navbarHeight = 68;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth',
        });
        return;
      }
    }

    // Default: Reset scroll position to top on page transition
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, hash]);

  return null;
}
