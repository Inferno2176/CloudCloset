import React, { useState, useRef, useEffect } from "react";
import { FALLBACK_PRODUCT_IMAGE, getProductImageUrl } from "../data/products";

/**
 * ProductImage component provides:
 * - Shimmer skeleton placeholder while image loads
 * - Cached image instant resolution via ref.complete
 * - Graceful fallback to inline SVG placeholder if image fails (never shows broken-image icon)
 * - Future-proof S3 integration via getProductImageUrl data layer helper
 * - Consistent 3:4 portrait or custom aspect ratio preserving card geometry
 */
export default function ProductImage({
  product,
  imageIndex = 0,
  src,
  alt,
  className = "",
  aspectRatio = "aspect-[3/4]",
  priority = false
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  // Determine initial image source
  const primarySrc = src || (product ? getProductImageUrl(product, imageIndex) : FALLBACK_PRODUCT_IMAGE);
  const resolvedAlt = alt || product?.name || "CloudCloset Garment";

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoading(false);
      }
    }
  }, [primarySrc]);

  return (
    <div className={`relative w-full overflow-hidden bg-surface-container ${aspectRatio} ${className}`}>
      {/* Shimmer skeleton placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#EFEEEB] animate-pulse flex flex-col items-center justify-center p-4 select-none z-0">
          <div className="w-8 h-8 rounded-full border border-[#E8E6E1] flex items-center justify-center mb-1 text-[#747878]/50">
            <span className="material-symbols-outlined text-[18px]">styler</span>
          </div>
          <span className="font-serif text-[9px] tracking-widest uppercase text-[#747878]/60">
            CloudCloset
          </span>
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={hasError ? FALLBACK_PRODUCT_IMAGE : primarySrc}
        alt={resolvedAlt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover object-center transition-all duration-500 ${
          isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      />
    </div>
  );
}
