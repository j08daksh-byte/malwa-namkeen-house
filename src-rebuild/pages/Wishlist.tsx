import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/sections/Footer';
import SEOHead from '../components/seo/SEOHead';
import { useWishlist } from '../lib/wishlistContext';
import { useCart } from '../lib/cartContext';
import { type Product, type ProductWeightOption } from '../data/products';
import { isProductAvailable } from '../components/shop/ProductCard';

export default function Wishlist() {
  const navigate = useNavigate();
  const { wishlist, wishlistCount, toggleWishlist, loading } = useWishlist();
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const opt: ProductWeightOption =
      product.options && product.options.length > 0
        ? product.options[0]
        : { weight: 'Standard', price: (product as any).price || 120 };
    addToCart(product, opt, 1);
    openCart();
  };

  const handleRemove = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      style={{
        background: 'var(--bg-parchment, #F6EFE3)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SEOHead
        title="Your Saved Delicacies — Wishlist | MALWA NAMKEEN HOUSE"
        description="Review and manage your saved Malwa Namkeen delicacies, festive hampers, and authentic Ratlami snacks."
        canonicalPath="/wishlist"
      />
      <Navbar />

      <main style={{ flex: 1, padding: 'clamp(24px, 4vw, 48px) clamp(16px, 3vw, 40px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              marginBottom: '32px',
              borderBottom: '1px solid rgba(200, 154, 61, 0.25)',
              paddingBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
                  fontSize: 'clamp(26px, 3.5vw, 36px)',
                  fontWeight: 800,
                  color: '#3C0815',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Saved Delicacies
              </h1>
              {wishlistCount > 0 && (
                <span
                  style={{
                    background: '#D4AA45',
                    color: '#3D0007',
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            <p
              style={{
                color: '#75645C',
                fontSize: '14.5px',
                marginTop: '8px',
                marginBottom: 0,
                maxWidth: '600px',
              }}
            >
              Your personal selection of favorite Ratlami namkeens, artisanal sweets, and seasonal snacks.
            </p>
          </div>

          {/* Loading or Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#75645C' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #3C0815',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Loading saved items…
            </div>
          ) : wishlist.length === 0 ? (
            /* Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '72px 24px',
                background: '#FDFAF4',
                borderRadius: '16px',
                border: '1px dashed rgba(200, 154, 61, 0.35)',
                maxWidth: '560px',
                margin: '24px auto',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(212, 170, 69, 0.15)',
                  color: '#D4AA45',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <Heart size={30} strokeWidth={1.8} />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#3C0815',
                  margin: '0 0 8px',
                }}
              >
                Your wishlist is empty
              </h2>
              <p
                style={{
                  color: '#75645C',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  margin: '0 auto 24px',
                  maxWidth: '380px',
                }}
              >
                Explore our small-batch Ratlami Sev, artisanal mixtures, and handcrafted mathris to save your favorites.
              </p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#3C0815',
                  color: '#FFF8EC',
                  padding: '12px 28px',
                  borderRadius: '999px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Explore The Shop <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            /* Wishlist Grid */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '24px',
              }}
            >
              {wishlist.map(product => {
                const prodId = String(product.id || (product as any)._id);
                const price =
                  product.options?.[0]?.price ?? (product as any).price ?? 120;
                const inStock = isProductAvailable(product);
                const image =
                  (Array.isArray((product as any).images) && (product as any).images[0]) ||
                  product.image ||
                  '/hero-banner-1.png';

                return (
                  <div
                    key={prodId}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(42, 0, 5, 0.06)',
                      border: '1px solid rgba(200, 154, 61, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Image Container */}
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '1 / 1',
                        background: '#FAF6EF',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                      onClick={() => navigate(`/product/${product.slug || prodId}`)}
                    >
                      <img
                        src={image}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s',
                        }}
                      />
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={e => handleRemove(product, e)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.92)',
                          border: 'none',
                          color: '#DC2626',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          transition: 'transform 0.15s, background 0.15s',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Stock badge */}
                      {!inStock && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            background: '#DC2626',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Sold Out
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#A06D1A',
                          letterSpacing: '0.05em',
                          marginBottom: '4px',
                        }}
                      >
                        {product.categoryLabel || product.category || 'Namkeens'}
                      </div>

                      <h3
                        onClick={() => navigate(`/product/${product.slug || prodId}`)}
                        style={{
                          fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#3C0815',
                          margin: '0 0 6px',
                          cursor: 'pointer',
                          lineHeight: 1.3,
                        }}
                      >
                        {product.name}
                      </h3>

                      {product.hindiName && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#75645C',
                            marginBottom: '10px',
                          }}
                        >
                          {product.hindiName}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: '12px',
                          borderTop: '1px solid #FAF0E2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-primary, 'DM Sans', sans-serif)",
                            fontSize: '17px',
                            fontWeight: 800,
                            color: '#3C0815',
                          }}
                        >
                          ₹{price}
                        </span>

                        <button
                          type="button"
                          disabled={!inStock}
                          onClick={e => handleAddToCart(product, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: inStock ? '#3C0815' : '#D1D5DB',
                            color: inStock ? '#FFF8EC' : '#6B7280',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: inStock ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s',
                          }}
                        >
                          <ShoppingBag size={14} />
                          {inStock ? 'Add to Basket' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
