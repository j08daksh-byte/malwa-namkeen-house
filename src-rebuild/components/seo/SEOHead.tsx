import React, { useEffect } from 'react';
import { BUSINESS } from '../../lib/business';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  structuredData?: object | object[];
}

const DEFAULT_TITLE = 'MALWA NAMKEEN HOUSE — THE NAMKEEN & SNACKS HUB';
const DEFAULT_DESC =
  'Authentic Malwa namkeens, small-batch Ratlami Sev, Ujjaini chivda, and festive gifting crafted with traditional spices and 100% pure cold-pressed groundnut oil.';
const DEFAULT_OG_IMAGE = '/logo.png';

export default function SEOHead({
  title,
  description = DEFAULT_DESC,
  canonicalPath = '',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Page Title
    const fullTitle = title ? `${title} | MALWA NAMKEEN HOUSE` : DEFAULT_TITLE;
    document.title = fullTitle;

    // 2. Meta Tag Helper
    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard metadata
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${origin}${canonicalPath}`;
    const absoluteOgImage = ogImage.startsWith('http') ? ogImage : `${origin}${ogImage}`;

    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', absoluteOgImage);
    setMetaTag('property', 'og:site_name', 'MALWA NAMKEEN HOUSE');

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', absoluteOgImage);

    // 3. Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 4. Structured Data (JSON-LD)
    const scriptId = 'malwa-json-ld';
    let scriptEl = document.getElementById(scriptId);
    if (structuredData) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(structuredData);
    } else if (scriptEl) {
      scriptEl.remove();
    }
  }, [title, description, canonicalPath, ogImage, ogType, noIndex, structuredData]);

  return null;
}
