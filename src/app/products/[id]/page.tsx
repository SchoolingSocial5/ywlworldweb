"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductImageModal from "@/components/ProductImageModal";
import { useProductStore, Product } from "@/store/useProductStore";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { formatPrice } from "@/utils/format";
import { getImageUrl } from "@/utils/image";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { products, fetchProducts, fetchProductById } = useProductStore();
  const { addToCart, cart, updateQuantity, removeFromCart } = useCart();
  const { settings } = useSettings();
  const { hydrated, hydrate, toggle, isWishlisted } = useWishlistStore();
  const activeCurrency = useCurrencyStore(state => state.activeCurrency);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setImgError(false);
      setActiveImgIndex(0);
      
      const data = await fetchProductById(id);
      if (data) {
        setProduct(data);
      } else {
        setProduct(null);
      }
      setLoading(false);
    };
    load();
  }, [id, fetchProductById]);

  // Ensure store is populated for related products
  useEffect(() => {
    if (products.length === 0) fetchProducts();
  }, []);

  const cartItem = cart.find((c) => String(c.id) === String(id));

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ 
      id: product.id, 
      name: product.name, 
      category: product.category, 
      price: product.price, 
      color: product.color, 
      image_url: product.image_url, 
      quantity: product.quantity
    });
  };

  const related = products
    .filter((p) => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4);

  const urls = product?.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : (product?.image_url ? [product.image_url] : []);

  const resolvedImg = getImageUrl(urls[activeImgIndex] || product?.image_url);
  const showImage = resolvedImg && !imgError;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && urls.length > 1) {
      setActiveImgIndex((prev) => (prev + 1) % urls.length);
    } else if (isRightSwipe && urls.length > 1) {
      setActiveImgIndex((prev) => (prev - 1 + urls.length) % urls.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
        <Header />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
            <div className="aspect-[3/4] bg-gray-200 dark:bg-neutral-800 rounded-2xl" />
            <div className="space-y-4 pt-4">
              <div className="h-6 w-24 bg-gray-200 dark:bg-neutral-800 rounded" />
              <div className="h-10 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded" />
              <div className="h-8 w-1/3 bg-gray-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-neutral-800 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-neutral-800 rounded" />
              <div className="h-14 w-full bg-gray-200 dark:bg-neutral-800 rounded-xl mt-8" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="w-full min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
        <Header />
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-20 text-center">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4">Product not found</p>
          <Link href="/" className="text-sm font-bold underline text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const inStock = product.quantity > 0;

  return (
    <main className="w-full min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
      <Header />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main product area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-16 md:mb-24">
          {/* Image Gallery Column */}
          <div className="flex flex-col gap-4">
            {/* Main Image Slider */}
            <div 
              onClick={() => {
                if (product) {
                  setPreviewProducts([product]);
                  setPreviewInitialIndex(0);
                  setIsPreviewOpen(true);
                }
              }}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800 shadow-sm cursor-pointer group"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggle(product.id); }}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur shadow-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
              >
                {isWishlisted(product.id) ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500 dark:text-gray-300">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                )}
              </button>

              {urls.length > 0 && !imgError ? (
                <div 
                  className="absolute inset-0 w-full h-full flex transition-transform duration-500 ease-out z-0"
                  style={{ transform: `translateX(-${activeImgIndex * 100}%)` }}
                >
                  {urls.map((url, i) => (
                    <div key={i} className="w-full h-full flex-shrink-0 relative">
                      <img
                        src={getImageUrl(url) || ""}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750 ease-out"
                        onError={() => setImgError(true)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-neutral-800 dark:to-neutral-700" />
              )}

              {/* Mobile Indicator Dots */}
              {urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 bg-black/35 backdrop-blur px-2.5 py-1.5 rounded-full md:hidden">
                  {urls.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === activeImgIndex ? "bg-white w-4" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop / Interactive Thumbnail Grid */}
            {urls.length > 1 && (
              <div className="grid grid-cols-5 gap-3 pt-2">
                {urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImgIndex(i)}
                    onMouseEnter={() => setActiveImgIndex(i)}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800 border-2 transition-all duration-300 cursor-pointer ${
                      i === activeImgIndex 
                        ? "border-black dark:border-white scale-[1.03] shadow-md" 
                        : "border-transparent opacity-60 hover:opacity-100 hover:scale-[1.02]"
                    }`}
                  >
                    <img
                      src={getImageUrl(url) || ""}
                      alt={`${product.name} Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col py-2 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-3 capitalize">{product.category}</p>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 leading-tight mb-4">
              {product.name}
            </h1>
            <p className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-6">
              {formatPrice(product.price, settings?.currency_symbol)}
            </p>

            {/* Color */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Color</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-neutral-800 shadow-md ring-2 ring-gray-300 dark:ring-neutral-600"
                  style={{ backgroundColor: product.color }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{product.color}</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6 w-full max-w-full">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Description</p>
                <style dangerouslySetInnerHTML={{ __html: `
                  .product-description-content * {
                    white-space: pre-wrap !important;
                    word-break: break-word !important;
                    overflow-wrap: break-word !important;
                    max-width: 100% !important;
                  }
                `}} />
                <div
                  className="product-description-content prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:dark:text-gray-100 [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:dark:text-gray-100 [&_img]:max-w-full [&_img]:h-auto [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:block [&_iframe]:max-w-full [&_video]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Stock */}
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                In Stock
              </span>
            </div>

            {/* Cart action */}
            {cartItem ? (
              <div className="flex items-center gap-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl p-2 w-fit mb-4">
                <button
                  onClick={() => { if (cartItem.quantity > 1) updateQuantity(product.id, cartItem.quantity - 1); else removeFromCart(product.id); }}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-neutral-700 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors text-gray-700 dark:text-gray-300 font-bold text-xl cursor-pointer"
                >
                  −
                </button>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100 min-w-[2rem] text-center">{cartItem.quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-neutral-700 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors text-gray-700 dark:text-gray-300 font-bold text-xl cursor-pointer"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full py-4 text-sm font-black uppercase tracking-widest rounded-2xl transition-all duration-200 cursor-pointer mb-4 bg-black dark:bg-white text-white dark:text-black hover:opacity-85 active:scale-[0.98] shadow-lg shadow-black/10"
              >
                Add to Cart
              </button>
            )}

            <Link
              href="/checkout"
              onClick={() => {
                if (!cartItem) handleAddToCart();
              }}
              className="w-full py-4 text-sm font-black uppercase tracking-widest rounded-2xl border-2 text-center transition-all duration-200 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black"
            >
              Buy Now
            </Link>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">
                More in {product.category}
              </h2>
              <Link
                href="/"
                className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {related.map((p, index) => (
                <ProductCard 
                  key={p.id} 
                  {...p} 
                  onImageClick={() => {
                    setPreviewProducts(related);
                    setPreviewInitialIndex(index);
                    setIsPreviewOpen(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ProductImageModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        products={previewProducts}
        initialIndex={previewInitialIndex}
      />
    </main>
  );
}
