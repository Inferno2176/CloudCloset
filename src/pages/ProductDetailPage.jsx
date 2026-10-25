import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";
import ProductImage from "../components/ProductImage";

export default function ProductDetailPage() {
  const {
    selectedProduct,
    addToCart,
    toggleWishlist,
    isWishlisted,
    setIsSizeGuideOpen,
    setActivePage,
    products
  } = useShop();

  const product = selectedProduct || products[0];

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("400001");
  const [pincodeChecked, setPincodeChecked] = useState(true);
  const [pincodeMessage, setPincodeMessage] = useState("Delivery by Thursday, 24 Oct to Mumbai (400001) | FREE EXPRESS");

  // Accordion states
  const [openAccordion, setOpenAccordion] = useState("fabric"); // 'fabric', 'care', 'shipping'

  const wishlisted = isWishlisted(product.id);

  const checkPincode = (e) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeChecked(true);
      const cities = {
        "400": "Mumbai",
        "110": "New Delhi",
        "560": "Bengaluru",
        "600": "Chennai",
        "700": "Kolkata",
        "500": "Hyderabad"
      };
      const prefix = pincode.substring(0, 3);
      const city = cities[prefix] || "Your Pincode";
      setPincodeMessage(`Delivery by Thursday, 24 Oct to ${city} (${pincode}) | FREE EXPRESS`);
    } else {
      setPincodeChecked(false);
      setPincodeMessage("Please enter a valid 6-digit Indian PIN code.");
    }
  };

  const handleAddToBag = () => {
    addToCart(product, selectedColor, selectedSize, quantity);
  };

  const handleInstantCheckout = () => {
    addToCart(product, selectedColor, selectedSize, quantity);
    setActivePage("cart");
  };

  const relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="w-full bg-surface pb-space-2xl">
      {/* Breadcrumb Trail */}
      <section className="w-full px-margin-mobile lg:px-margin pt-space-md pb-space-sm">
        <nav className="flex items-center gap-space-xs text-on-surface-variant font-sans text-[11px] uppercase tracking-wider">
          <button
            onClick={() => setActivePage("home")}
            className="hover:text-primary transition-colors"
          >
            Home
          </button>
          <span className="text-outline-variant">/</span>
          <button
            onClick={() => setActivePage("catalog")}
            className="hover:text-primary transition-colors"
          >
            {product.gender}
          </button>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">{product.category}</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-bold line-clamp-1">{product.name}</span>
        </nav>
      </section>

      {/* Main Two-Column Asymmetrical Grid */}
      <section className="w-full px-margin-mobile lg:px-margin mt-space-sm">
        <div className="max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Column: Multi-Angle Scrollable Gallery */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            {/* Primary Main Image Frame */}
            <div className="relative aspect-[3/4] w-full bg-surface-container overflow-hidden border border-surface-variant">
              <ProductImage
                product={product}
                imageIndex={selectedImage}
                alt={product.name}
                priority={true}
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-space-md right-space-md w-10 h-10 rounded-full bg-surface/90 backdrop-blur-sm flex items-center justify-center text-primary hover:text-secondary shadow-md transition-colors z-10"
                aria-label="Wishlist toggle"
              >
                <span className={`material-symbols-outlined text-[20px] ${wishlisted ? "filled text-secondary" : ""}`}>
                  favorite
                </span>
              </button>
              {product.badge && (
                <div className="absolute top-space-md left-space-md bg-surface-container-lowest text-primary font-sans text-[11px] font-bold uppercase tracking-wider px-3 py-1 shadow-sm border border-surface-variant z-10">
                  {product.badge}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-space-sm">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-[3/4] overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-primary shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ProductImage src={imgUrl} alt={`${product.name} angle ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Purchasing Drawer */}
          <div className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-28">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between mb-space-xs">
                <span className="font-sans text-[11px] font-bold tracking-widest uppercase text-secondary">
                  {product.provenance || "100% GOTS Organic"}
                </span>
                <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                  ★ {product.rating} <span className="text-outline font-normal">({product.reviewCount} reviews)</span>
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal leading-tight">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-space-md mt-space-sm pb-space-sm border-b border-surface-variant">
                <span className="font-sans text-2xl font-bold text-primary">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-sans text-base text-outline line-through">
                    ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary-container px-2 py-0.5 rounded">
                  Inclusive of all taxes (GST 12%)
                </span>
              </div>
            </div>

            {/* COLOR SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                  Select Shade: <span className="text-on-surface-variant font-normal">{selectedColor?.name}</span>
                </label>
              </div>
              <div className="flex items-center gap-space-sm">
                {product.colors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(c)}
                    className={`w-9 h-9 rounded-full border transition-transform ${
                      selectedColor?.name === c.name
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110 shadow-sm"
                        : "border-surface-variant hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* SIZE SELECTOR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                    Select Size
                  </span>
                  <span className="text-[10px] font-bold text-secondary bg-secondary-fixed/50 px-1.5 py-0.5 uppercase tracking-widest">
                    True to Size
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="font-sans text-xs uppercase tracking-wider text-on-surface-variant hover:text-primary underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">straighten</span>
                  Size Guide
                </button>
              </div>

              {/* Size Buttons Matrix */}
              <div className="grid grid-cols-6 gap-space-xs">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    disabled={!s.available}
                    onClick={() => setSelectedSize(s.size)}
                    className={`py-space-sm font-sans text-xs font-semibold uppercase transition-colors border ${
                      !s.available
                        ? "opacity-30 border-dashed border-outline-variant cursor-not-allowed line-through"
                        : selectedSize === s.size
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-surface-container-lowest text-primary border-surface-variant hover:border-primary"
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>

              {/* Size Helper Note */}
              <div className="flex items-start gap-space-xs text-on-surface-variant bg-surface-container-low px-space-md py-space-xs mt-2 border border-surface-variant/40">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                  info
                </span>
                <p className="font-sans text-xs leading-relaxed">
                  Relaxed architectural drape. Model is 5'11" wearing size M. Order your standard size for the editorial silhouette.
                </p>
              </div>
            </div>

            {/* INDIAN PIN CODE DELIVERY CHECKER */}
            <div className="bg-surface-container-low p-space-md border border-surface-variant flex flex-col gap-space-xs">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="pincode-input" className="font-sans text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-secondary">local_shipping</span>
                  Delivery & Express Dispatch
                </label>
                <span className="font-sans text-[10px] font-bold text-secondary uppercase tracking-widest">
                  All India
                </span>
              </div>
              <form onSubmit={checkPincode} className="flex items-center gap-space-xs">
                <input
                  id="pincode-input"
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN"
                  className="w-full bg-surface-container-lowest text-sm font-semibold text-primary px-space-md py-2 border border-surface-variant focus:outline-none focus:border-primary tracking-wider"
                />
                <button
                  type="submit"
                  className="bg-primary text-on-primary font-sans text-xs font-bold uppercase tracking-widest px-space-lg py-2 hover:bg-secondary transition-colors shrink-0"
                >
                  Check
                </button>
              </form>
              {pincodeMessage && (
                <div className={`flex items-center gap-1.5 pt-space-xs text-xs ${pincodeChecked ? "text-secondary font-medium" : "text-error"}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {pincodeChecked ? "verified" : "error"}
                  </span>
                  <span>{pincodeMessage}</span>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS: QUANTITY & PRIMARY CTA */}
            <div className="flex flex-col gap-space-xs pt-space-xs">
              <div className="flex items-center gap-space-sm">
                {/* Counter */}
                <div className="flex items-center bg-surface-container-lowest border border-surface-variant p-0.5">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                  >
                    -
                  </button>
                  <span className="w-9 text-center text-sm font-bold text-primary">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Bag CTA */}
                <button
                  onClick={handleAddToBag}
                  className="flex-1 bg-primary text-on-primary hover:bg-secondary py-3.5 px-space-lg font-sans text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-y-0.5">
                    shopping_bag
                  </span>
                  <span>Add to Bag · ₹{(product.price * quantity).toLocaleString("en-IN")}</span>
                </button>
              </div>

              {/* Instant Checkout Secondary Action */}
              <button
                onClick={handleInstantCheckout}
                className="w-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed py-3 px-space-md font-sans text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-secondary-container"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Instant Checkout with UPI / Card
              </button>
            </div>

            {/* ACCORDIONS */}
            <div className="flex flex-col gap-space-xs pt-space-sm border-t border-surface-variant">
              {/* Accordion 1: Details & Fabric */}
              <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "fabric" ? "" : "fabric")}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-sans text-xs uppercase tracking-wider text-primary font-bold">
                    Product Details & Fabric
                  </span>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${openAccordion === "fabric" ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>
                {openAccordion === "fabric" && (
                  <div className="mt-space-md flex flex-col gap-space-xs text-xs text-on-surface-variant leading-relaxed">
                    <p>{product.fabric}</p>
                    <p className="mt-2 font-semibold text-primary">{product.origin}</p>
                  </div>
                )}
              </div>

              {/* Accordion 2: Care Instructions */}
              <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "care" ? "" : "care")}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-sans text-xs uppercase tracking-wider text-primary font-bold">
                    Care Instructions
                  </span>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${openAccordion === "care" ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>
                {openAccordion === "care" && (
                  <div className="mt-space-md text-xs text-on-surface-variant leading-relaxed">
                    <p>{product.care}</p>
                  </div>
                )}
              </div>

              {/* Accordion 3: Delivery & Returns */}
              <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="font-sans text-xs uppercase tracking-wider text-primary font-bold">
                    Complimentary Express Delivery & Returns
                  </span>
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${openAccordion === "shipping" ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>
                {openAccordion === "shipping" && (
                  <div className="mt-space-md text-xs text-on-surface-variant leading-relaxed">
                    <p>
                      All orders enjoy complimentary express dispatch across India within 24 hours. We offer a 15-day doorstep trial window with hassle-free reverse pickup.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete the Look Section */}
      <section className="w-full px-margin-mobile lg:px-margin mt-space-2xl pt-space-xl border-t border-surface-variant">
        <div className="max-w-[1720px] mx-auto">
          <div className="mb-space-lg">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-secondary">
              Atelier Pairing
            </span>
            <h2 className="font-serif text-2xl lg:text-3xl text-primary font-normal mt-1">
              Complete the Editorial Silhouette
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
