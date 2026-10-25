import React from "react";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";

export default function ProductListingPage() {
  const {
    products,
    genderFilter,
    setGenderFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    setActivePage
  } = useShop();

  const categories = [
    "All",
    "Outerwear",
    "Shirts",
    "Trousers",
    "Knitwear",
    "Dresses",
    "Accessories",
    "New Arrivals",
    "Trending",
    "Sale"
  ];
  const genders = ["All", "Men", "Women", "Unisex"];

  // Filter products
  let filtered = products.filter((product) => {
    // Only display active products in customer catalogue
    if (product.status && product.status !== "active") {
      return false;
    }
    // Strict gender filtering for Men, Women, and Unisex
    if (genderFilter !== "All" && product.gender !== genderFilter) {
      return false;
    }
    // Category filter
    if (categoryFilter !== "All") {
      if (categoryFilter === "New Arrivals") {
        if (!product.isNewArrival && !product.badge?.includes("Season") && !product.badge?.includes("Drop")) return false;
      } else if (categoryFilter === "Trending") {
        if (!product.isTrending) return false;
      } else if (categoryFilter === "Sale") {
        if (!product.originalPrice || product.originalPrice <= product.price) return false;
      } else if (product.category !== categoryFilter) {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = product.name?.toLowerCase().includes(q);
      const matchCat = product.category?.toLowerCase().includes(q);
      const matchSubcat = product.subcategory?.toLowerCase().includes(q);
      const matchDesc = product.description?.toLowerCase().includes(q);
      const matchProv = product.provenance?.toLowerCase().includes(q);
      const matchFabric = product.fabric?.toLowerCase().includes(q);
      const matchOrigin = product.origin?.toLowerCase().includes(q);
      const matchBadge = product.badge?.toLowerCase().includes(q);
      const matchTags = product.tags?.some((t) => t.toLowerCase().includes(q));
      const matchColors = product.colors?.some((c) => c.name.toLowerCase().includes(q));
      if (
        !matchName &&
        !matchCat &&
        !matchSubcat &&
        !matchDesc &&
        !matchProv &&
        !matchFabric &&
        !matchOrigin &&
        !matchBadge &&
        !matchTags &&
        !matchColors
      ) {
        return false;
      }
    }
    return true;
  });

  // Sort products
  if (sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === "newest") {
    filtered.sort((a, b) => {
      if (a.isNewArrival && !b.isNewArrival) return -1;
      if (!a.isNewArrival && b.isNewArrival) return 1;
      return b.id.localeCompare(a.id);
    });
  } else if (sortBy === "featured") {
    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }

  const clearAllFilters = () => {
    setGenderFilter("All");
    setCategoryFilter("All");
    setSearchQuery("");
    setSortBy("featured");
  };

  const hasActiveFilters = genderFilter !== "All" || categoryFilter !== "All" || searchQuery !== "" || sortBy !== "featured";

  return (
    <div className="w-full bg-surface pb-space-2xl">
      {/* Top Editorial Header & Category Meta */}
      <section className="w-full px-margin-mobile lg:px-margin pt-space-md pb-space-lg">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center gap-space-xs mb-space-md text-on-surface-variant font-sans text-[11px] uppercase tracking-wider">
          <button
            onClick={() => setActivePage("shop")}
            className="hover:text-primary transition-colors"
          >
            Home
          </button>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Ready to Wear</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-bold">
            {genderFilter === "All" && categoryFilter === "All"
              ? "Catalog"
              : categoryFilter !== "All" && genderFilter === "All"
              ? categoryFilter
              : categoryFilter !== "All"
              ? `${genderFilter}'s ${categoryFilter}`
              : `${genderFilter}'s Collection`}
          </span>
        </nav>

        {/* Asymmetrical Title & Statement Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-md border-b border-surface-variant">
          <div className="max-w-2xl">
            <span className="font-sans text-[11px] tracking-[0.2em] uppercase text-secondary font-bold block mb-space-xs">
              SS/25 Lookbook Edition
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-primary tracking-tight font-normal">
              {genderFilter === "All" && categoryFilter === "All"
                ? "Atelier Catalog"
                : categoryFilter !== "All" && genderFilter === "All"
                ? `${categoryFilter} Collection`
                : categoryFilter !== "All"
                ? `${genderFilter}'s ${categoryFilter}`
                : `${genderFilter}’s Contemporary Collection`}
            </h1>
            <p className="font-sans text-sm text-on-surface-variant mt-space-sm leading-relaxed max-w-xl">
              Contemporary garments defined by relaxed silhouettes, clean tailoring, and tactile breathable fabrics curated intentionally for the modern climate.
            </p>
          </div>

          <div className="flex items-center gap-space-sm text-xs font-semibold uppercase tracking-wider text-outline shrink-0">
            <span>{filtered.length} {filtered.length === 1 ? "Garment" : "Garments"} Available</span>
          </div>
        </div>

        {/* Filter and Sorting Control Bar */}
        <div className="mt-space-lg flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-md border-b border-surface-variant">
          {/* Gender Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline mr-1">
              Gender:
            </span>
            {genders.map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                  genderFilter === g
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-container-lowest text-primary border-surface-variant hover:border-primary"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-space-sm">
            <label htmlFor="sort-select" className="text-[10px] font-bold uppercase tracking-widest text-outline">
              Sort By:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container-lowest border border-surface-variant px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="featured">Featured Curations</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="mt-space-md flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline mr-1 shrink-0">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-secondary text-white font-semibold"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-[11px] font-bold uppercase tracking-wider text-error hover:underline shrink-0 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Product Grid Area */}
      <section className="w-full px-margin-mobile lg:px-margin mt-space-md">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} priority={idx < 8} />
            ))}
          </div>
        ) : (
          <div className="py-space-2xl text-center bg-surface-container-low border border-surface-variant p-space-xl">
            <span className="material-symbols-outlined text-4xl text-outline mb-space-sm">
              styler
            </span>
            <h3 className="font-serif text-2xl text-primary font-normal">
              No matching pieces found
            </h3>
            <p className="font-sans text-xs text-on-surface-variant max-w-md mx-auto mt-2 leading-relaxed">
              We couldn't find any garments matching your current filter criteria ({genderFilter !== "All" ? `${genderFilter}'s ` : ""}{categoryFilter !== "All" ? categoryFilter : "garments"}). Try resetting your filters or exploring our complete seasonal catalog.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-space-md">
              {categoryFilter !== "All" && (
                <button
                  onClick={() => setCategoryFilter("All")}
                  className="bg-surface-container-lowest border border-primary text-primary px-space-md py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
                >
                  View All {genderFilter !== "All" ? genderFilter : "Garments"}
                </button>
              )}
              {genderFilter !== "All" && (
                <button
                  onClick={() => setGenderFilter("All")}
                  className="bg-surface-container-lowest border border-primary text-primary px-space-md py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-colors"
                >
                  View All {categoryFilter !== "All" ? categoryFilter : "Collections"}
                </button>
              )}
              <button
                onClick={clearAllFilters}
                className="bg-primary text-on-primary px-space-lg py-2 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                Show All Garments
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
