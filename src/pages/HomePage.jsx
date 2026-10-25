import React from "react";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";

export default function HomePage() {
  const { products, navigateToCategory, applyCouponCode } = useShop();

  // Curate 4 distinct new arrivals
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 4);
  // Curate 4 featured pieces completely distinct from newArrivals
  const featuredLooks = products
    .filter((p) => p.isFeatured && !newArrivals.some((na) => na.id === p.id))
    .slice(0, 4);

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section: Architectural Split with Editorial Typography */}
      <section className="w-full relative px-margin-mobile lg:px-margin py-space-xl lg:py-space-2xl bg-surface">
        <div className="max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
          {/* Left Column: Editorial Manifesto & Action */}
          <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1 pt-space-md lg:pt-0">
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="font-sans text-[11px] font-bold text-secondary uppercase tracking-widest">
                CloudCloset Studio
              </span>
              <span className="w-4 h-px bg-outline-variant"></span>
              <span className="font-sans text-[11px] font-semibold text-outline uppercase tracking-wider">
                Curated Line
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[72px] text-primary tracking-tight font-normal leading-[1.06] mb-space-md animate-hero-headline">
              Style That Speaks.
            </h1>

            <p className="font-sans text-base lg:text-lg text-on-surface-variant max-w-md mb-space-xl leading-relaxed animate-hero-subtext">
              Discover everyday essentials and contemporary pieces designed for your lifestyle. Engineered with organic fabrics and architectonic precision.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md animate-hero-cta">
              <button
                onClick={() => navigateToCategory("Men")}
                className="bg-primary text-on-primary font-sans text-xs font-bold uppercase tracking-widest px-space-xl py-space-md text-center hover:bg-secondary active:scale-[0.98] transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                Shop Men
              </button>
              <button
                onClick={() => navigateToCategory("Women")}
                className="bg-surface-container-lowest text-primary border border-surface-variant font-sans text-xs font-bold uppercase tracking-widest px-space-xl py-space-md text-center hover:bg-primary hover:text-on-primary active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Shop Women
              </button>
            </div>

            {/* Three Pillar Provenance Strip */}
            <div className="grid grid-cols-3 gap-space-md mt-space-2xl pt-space-lg bg-surface-container-low p-space-md border border-surface-variant/50 animate-hero-meta">
              <div>
                <p className="font-sans text-[10px] text-outline uppercase tracking-wider font-semibold">Provenance</p>
                <p className="font-serif text-sm lg:text-base text-primary font-medium mt-1">100% GOTS</p>
              </div>
              <div>
                <p className="font-sans text-[10px] text-outline uppercase tracking-wider font-semibold">Architecture</p>
                <p className="font-serif text-sm lg:text-base text-primary font-medium mt-1">Boxy & Fluid</p>
              </div>
              <div>
                <p className="font-sans text-[10px] text-outline uppercase tracking-wider font-semibold">Dispatch</p>
                <p className="font-serif text-sm lg:text-base text-primary font-medium mt-1">24h Express</p>
              </div>
            </div>
          </div>

          {/* Right Column: Dual Overlapping Architectural Visuals */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="grid grid-cols-12 gap-space-sm items-end">
              {/* Primary Editorial Campaign Visual */}
              <div className="col-span-7 relative group overflow-hidden bg-surface-container border border-surface-variant animate-hero-image-primary shadow-sm">
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85"
                    alt="CloudCloset SS25 Minimalist Tailoring Campaign"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="eager"
                  />
                </div>
                <div className="absolute bottom-space-md left-space-md bg-surface/90 backdrop-blur-md px-space-sm py-space-xs border border-surface-variant">
                  <p className="font-sans text-[10px] font-bold uppercase text-primary tracking-widest">
                    SS25 Editorial Campaign
                  </p>
                </div>
              </div>

              {/* Overlapping Complementary Editorial Visual - Purely editorial, no product card elements */}
              <div className="col-span-5 relative group overflow-hidden -ml-space-md lg:-ml-space-lg mb-space-lg bg-surface-container-high z-10 shadow-2xl border border-surface-variant animate-hero-image-secondary">
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=1200&q=85"
                    alt="CloudCloset Contemporary Atelier Silhouette"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-Season Promotional Ribbon */}
      <section className="w-full bg-secondary text-on-secondary py-space-md px-margin-mobile lg:px-margin border-y border-secondary-fixed/30">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-md">
            <span className="material-symbols-outlined text-secondary-fixed text-[24px]">verified</span>
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-secondary-fixed">
                Mid-Season Curation
              </p>
              <p className="font-serif text-lg tracking-tight text-on-secondary font-medium">
                Up to 30% Off Select Essentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            <button
              onClick={() => applyCouponCode("CLOUD10")}
              className="bg-surface-container-lowest text-primary px-space-md py-space-xs font-sans text-xs uppercase tracking-widest hover:scale-105 transition-transform"
              title="Click to apply coupon CLOUD10"
            >
              Code: <span className="font-bold text-secondary">CLOUD10</span>
            </button>
            <p className="font-sans text-xs text-secondary-fixed hidden lg:inline">
              Extra 10% on your first app order
            </p>
            <button
              onClick={() => navigateToCategory("All", "Sale")}
              className="bg-primary text-on-primary font-sans text-[11px] font-bold uppercase tracking-wider px-space-md py-space-xs hover:bg-surface hover:text-primary transition-colors"
            >
              Shop Curation
            </button>
          </div>
        </div>
      </section>

      {/* New Arrivals Grid Section */}
      <section className="w-full px-margin-mobile lg:px-margin py-space-2xl bg-surface">
        <div className="max-w-[1720px] mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-space-xl pb-space-sm border-b border-surface-variant">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-secondary">
                Drop 03 — Limited Inventory
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl text-primary tracking-tight font-medium mt-1">
                New Arrivals
              </h2>
            </div>
            <div className="flex items-center gap-space-lg mt-space-md md:mt-0">
              <span className="font-sans text-xs text-on-surface-variant">
                {products.filter((p) => p.isNewArrival).length} garments tailored in limited batches
              </span>
              <button
                onClick={() => navigateToCategory("All", "New Arrivals")}
                className="font-sans text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary flex items-center gap-1 transition-colors"
              >
                View All <span className="material-symbols-outlined text-[18px]">east</span>
              </button>
            </div>
          </div>

          {/* 4-Column Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} priority={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Curated Categories Architectural Showcase */}
      <section className="w-full px-margin-mobile lg:px-margin py-space-2xl bg-surface-container-low border-y border-surface-variant">
        <div className="max-w-[1720px] mx-auto">
          <div className="mb-space-xl">
            <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-secondary">
              Atelier Collections
            </span>
            <h2 className="font-serif text-3xl lg:text-4xl text-primary tracking-tight font-medium mt-1">
              Shop by Category
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Category 1: Outerwear */}
            <div
              onClick={() => navigateToCategory("All", "Outerwear")}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer border border-surface-variant"
            >
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"
                alt="Outerwear collection"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-space-lg text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#cccccc]">SS25 Architecture</span>
                <h3 className="font-serif text-2xl font-normal mt-1">Structured Outerwear</h3>
                <span className="font-sans text-xs font-semibold uppercase tracking-wider mt-2 underline flex items-center gap-1 group-hover:text-secondary-fixed transition-colors">
                  Explore Trench & Blazers <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Category 2: Shirts & Tops */}
            <div
              onClick={() => navigateToCategory("All", "Shirts")}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer border border-surface-variant"
            >
              <img
                src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop"
                alt="Shirts collection"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-space-lg text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#cccccc]">Crisp 80s Cotton</span>
                <h3 className="font-serif text-2xl font-normal mt-1">Architectural Poplin</h3>
                <span className="font-sans text-xs font-semibold uppercase tracking-wider mt-2 underline flex items-center gap-1 group-hover:text-secondary-fixed transition-colors">
                  Explore Shirts <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>

            {/* Category 3: Trousers & Tailoring */}
            <div
              onClick={() => navigateToCategory("All", "Trousers")}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer border border-surface-variant"
            >
              <img
                src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop"
                alt="Trousers collection"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-space-lg text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#cccccc]">Handwoven Twill</span>
                <h3 className="font-serif text-2xl font-normal mt-1">Pleated Tailoring</h3>
                <span className="font-sans text-xs font-semibold uppercase tracking-wider mt-2 underline flex items-center gap-1 group-hover:text-secondary-fixed transition-colors">
                  Explore Trousers <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Looks Grid */}
      <section className="w-full px-margin-mobile lg:px-margin py-space-2xl bg-surface">
        <div className="max-w-[1720px] mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-space-xl pb-space-sm border-b border-surface-variant">
            <div>
              <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-secondary">
                Curated Selection
              </span>
              <h2 className="font-serif text-3xl lg:text-4xl text-primary tracking-tight font-medium mt-1">
                Featured Wardrobe Pieces
              </h2>
            </div>
            <button
              onClick={() => navigateToCategory("All")}
              className="font-sans text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary flex items-center gap-1 mt-4 md:mt-0 transition-colors"
            >
              View Full Archive <span className="material-symbols-outlined text-[18px]">east</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {featuredLooks.map((prod) => (
              <ProductCard key={prod.id} product={prod} priority={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Quote & Press Manifesto */}
      <section className="w-full py-space-2xl px-margin-mobile lg:px-margin bg-surface-container-high border-t border-surface-variant">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-secondary text-3xl mb-space-sm">format_quote</span>
          <blockquote className="font-serif text-2xl lg:text-3xl text-primary font-normal leading-relaxed italic mb-space-md">
            "CloudCloset delivers an uncompromising vision of modern Indian luxury: clothing where fabric provenance and architectural cut outshine transient trends."
          </blockquote>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Vogue India · Contemporary Design Issue 2025
          </p>
        </div>
      </section>
    </div>
  );
}
