import React from "react";
import { useShop } from "../context/ShopContext";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, priority = false }) {
  const { navigateToProduct, addToCart, toggleWishlist, isWishlisted, setQuickViewProduct } = useShop();
  const wishlisted = isWishlisted(product.id);

  return (
    <article className="flex flex-col group relative bg-surface-bright border border-transparent hover:border-surface-variant transition-all duration-300">
      {/* 3:4 Portrait Image Container with Fallback & Shimmer */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-surface-container">
        <ProductImage
          product={product}
          imageIndex={0}
          alt={product.name}
          priority={priority}
          className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />

        {/* Badges */}
        <div className="absolute top-space-sm left-space-sm flex flex-col gap-1 z-10">
          {product.badge && (
            <span className="bg-surface-container-lowest text-primary font-sans text-[10px] font-semibold tracking-wider uppercase px-2 py-1 shadow-sm">
              {product.badge}
            </span>
          )}
          {product.provenance && (
            <span className="bg-primary/80 backdrop-blur-sm text-on-primary font-sans text-[9px] tracking-widest uppercase px-1.5 py-0.5">
              {product.provenance}
            </span>
          )}
        </div>

        {/* Wishlist Button with smooth pop transition */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-space-sm right-space-sm w-8 h-8 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center text-primary hover:text-secondary transition-all duration-200 active:scale-90 hover:scale-105 z-10 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${wishlisted ? "filled text-secondary scale-110" : "scale-100"}`}>
            favorite
          </span>
        </button>

        {/* Quick Action Overlay on Hover - accessible on desktop & touch */}
        <div className="absolute inset-x-0 bottom-0 p-space-sm bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 touch-visible transition-opacity duration-300 flex items-center gap-space-xs z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="flex-1 bg-surface-container-lowest text-primary py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-surface-container-high active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
          >
            Quick View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="flex-1 bg-primary text-on-primary py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-secondary active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-secondary shadow-sm"
          >
            Add to Bag
          </button>
        </div>
      </div>

      {/* Product Information Details */}
      <div
        onClick={() => navigateToProduct(product)}
        className="p-space-sm flex flex-col flex-grow justify-between cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-1">
            <span>{product.gender} · {product.category}</span>
            {product.rating && (
              <span className="flex items-center gap-0.5 text-secondary">
                ★ {product.rating}
              </span>
            )}
          </div>
          
          <h3 className="font-serif text-[15px] text-primary group-hover:text-secondary transition-colors duration-200 line-clamp-1 leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Price & Color Preview */}
        <div className="flex items-center justify-between mt-space-sm pt-space-xs border-t border-surface-variant/50">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-semibold text-sm text-primary">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-sans text-xs text-outline line-through">
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Color preview swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 3).map((col, idx) => (
                <span
                  key={idx}
                  title={col.name}
                  className="w-2.5 h-2.5 rounded-full border border-surface-variant hover:scale-125 transition-transform duration-150 cursor-pointer"
                  style={{ backgroundColor: col.hex }}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[9px] text-outline">+{product.colors.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
