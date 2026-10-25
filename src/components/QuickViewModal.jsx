import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import ProductImage from "./ProductImage";

export default function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart, navigateToProduct, toggleWishlist, isWishlisted } = useShop();
  
  const productColors = React.useMemo(() => {
    if (!quickViewProduct?.colors) return [{ name: "Standard", hex: "#111111" }];
    const cols = Array.isArray(quickViewProduct.colors) ? quickViewProduct.colors : (() => {
      try { return JSON.parse(quickViewProduct.colors); } catch { return [{ name: "Standard", hex: "#111111" }]; }
    })();
    return cols.length > 0 ? cols : [{ name: "Standard", hex: "#111111" }];
  }, [quickViewProduct?.colors]);

  const productSizes = React.useMemo(() => {
    if (!quickViewProduct?.sizes) return [{ size: "M", available: true }];
    const szs = Array.isArray(quickViewProduct.sizes) ? quickViewProduct.sizes : (() => {
      try { return JSON.parse(quickViewProduct.sizes); } catch { return [{ size: "M", available: true }]; }
    })();
    return szs.length > 0 ? szs : [{ size: "M", available: true }];
  }, [quickViewProduct?.sizes]);

  const [selectedColor, setSelectedColor] = useState(productColors[0]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  if (!quickViewProduct) return null;

  const wishlisted = isWishlisted(quickViewProduct.id);

  const handleAdd = () => {
    addToCart(quickViewProduct, selectedColor, selectedSize, quantity);
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface max-w-3xl w-full border border-surface-variant shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-surface/90 flex items-center justify-center text-primary hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Left Column: Image */}
        <div className="md:w-1/2 aspect-[3/4] bg-surface-container overflow-hidden">
          <ProductImage
            product={quickViewProduct}
            imageIndex={0}
            alt={quickViewProduct.name}
            priority={true}
          />
        </div>

        {/* Right Column: Details & Actions */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-secondary">
                {quickViewProduct.provenance || "CloudCloset Atelier"}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-[10px] font-semibold tracking-widest uppercase text-outline">
                {quickViewProduct.gender} · {quickViewProduct.category}
              </span>
            </div>

            <h2 className="font-serif text-2xl text-primary font-normal leading-tight">
              {quickViewProduct.name}
            </h2>

            <div className="flex items-baseline gap-3 my-3">
              <span className="font-sans text-xl font-bold text-primary">
                ₹{quickViewProduct.price.toLocaleString("en-IN")}
              </span>
              {quickViewProduct.originalPrice && (
                <span className="text-sm text-outline line-through">
                  ₹{quickViewProduct.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
              {quickViewProduct.description}
            </p>

            {/* Color Selector */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1.5">
                Color: <span className="text-on-surface-variant font-normal">{selectedColor?.name}</span>
              </label>
              <div className="flex items-center gap-2">
                {productColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border transition-all ${
                      selectedColor?.name === c.name
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110"
                        : "border-surface-variant hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-1.5">
                Size
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {productSizes.map((s, idx) => (
                  <button
                    key={idx}
                    disabled={!s.available}
                    onClick={() => setSelectedSize(s.size)}
                    className={`py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                      !s.available
                        ? "opacity-30 border-dashed border-outline-variant cursor-not-allowed line-through"
                        : selectedSize === s.size
                        ? "bg-primary text-white border-primary"
                        : "bg-surface-container-lowest text-primary border-surface-variant hover:border-primary"
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Quantity:</span>
              <div className="flex items-center border border-surface-variant bg-surface-container-lowest">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-low text-primary"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-primary">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-low text-primary"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2 border-t border-surface-variant">
            <button
              onClick={handleAdd}
              className="w-full bg-primary text-on-primary py-3 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              Add to Bag · ₹{(quickViewProduct.price * quantity).toLocaleString("en-IN")}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuickViewProduct(null);
                  navigateToProduct(quickViewProduct);
                }}
                className="flex-1 border border-primary text-primary py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-surface-container-low transition-colors"
              >
                View Full Atelier Story
              </button>
              <button
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className="w-10 h-10 border border-surface-variant flex items-center justify-center text-primary hover:text-secondary transition-colors shrink-0"
              >
                <span className={`material-symbols-outlined text-[18px] ${wishlisted ? "filled text-secondary" : ""}`}>
                  favorite
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
