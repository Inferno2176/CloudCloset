import React, { useState } from "react";
import { useShop } from "../context/ShopContext";

export default function Header() {
  const {
    activePage,
    navigateTo,
    navigateToCategory,
    genderFilter,
    categoryFilter,
    cart,
    wishlist,
    user,
    signOut,
    searchQuery,
    setSearchQuery
  } = useShop();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const isHomeActive = activePage === "shop" || activePage === "home";
  const isMenActive = activePage === "catalog" && genderFilter === "Men";
  const isWomenActive = activePage === "catalog" && genderFilter === "Women";
  const isNewArrivalsActive = activePage === "catalog" && categoryFilter === "New Arrivals";
  const isTrendingActive = activePage === "catalog" && categoryFilter === "Trending";
  const isSaleActive = activePage === "catalog" && categoryFilter === "Sale";

  const handleNavClick = (page, _gender = "All") => {
    if (page === "home" || page === "shop") {
      navigateTo("shop");
    } else if (page === "men") {
      navigateToCategory("Men");
    } else if (page === "women") {
      navigateToCategory("Women");
    } else if (page === "new-arrivals") {
      navigateToCategory("All", "New Arrivals");
    } else if (page === "trending") {
      navigateToCategory("All", "Trending");
    } else if (page === "sale") {
      navigateToCategory("All", "Sale");
    } else {
      navigateTo(page);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-b border-surface-variant transition-all duration-200">
      {/* Main Navigation Bar */}
      <div className="h-20 w-full px-margin-mobile lg:px-margin flex items-center justify-between gap-gutter">
        {/* Mobile Hamburger & Brand Wordmark */}
        <div className="flex items-center gap-space-md">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-primary p-1 focus:outline-none hover:text-secondary transition-colors"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          <button
            onClick={() => handleNavClick("shop")}
            className="flex items-center gap-space-sm group text-left"
            aria-label="CloudCloset Home"
          >
            <span className="font-serif text-2xl lg:text-[28px] uppercase tracking-tight text-primary font-medium hover:text-secondary transition-colors">
              CloudCloset
            </span>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-space-lg text-[12px] font-semibold tracking-widest uppercase font-sans">
          <button
            onClick={() => handleNavClick("shop")}
            className={`nav-underline pb-1 ${
              isHomeActive
                ? "text-primary nav-active font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick("men")}
            className={`nav-underline pb-1 ${
              isMenActive
                ? "text-primary nav-active font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Men
          </button>
          <button
            onClick={() => handleNavClick("women")}
            className={`nav-underline pb-1 ${
              isWomenActive
                ? "text-primary nav-active font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Women
          </button>
          <button
            onClick={() => handleNavClick("new-arrivals")}
            className={`nav-underline pb-1 ${
              isNewArrivalsActive
                ? "text-primary nav-active font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            New Arrivals
          </button>
          <button
            onClick={() => handleNavClick("trending")}
            className={`nav-underline pb-1 ${
              isTrendingActive
                ? "text-primary nav-active font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => handleNavClick("sale")}
            className={`nav-underline pb-1 flex items-center gap-1.5 ${
              isSaleActive
                ? "text-primary nav-active font-bold"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Sale
            <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block animate-pulse"></span>
          </button>
        </nav>

        {/* Action Controls & Utilities */}
        <div className="flex items-center gap-space-md">
          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center border border-surface-variant px-space-sm py-1 bg-surface-container-lowest focus-within:border-primary transition-colors">
            <span className="text-[10px] font-bold text-on-surface-variant mr-space-sm select-none tracking-wider">
              ₹ INR
            </span>
            <div className="h-3 w-px bg-surface-variant mr-space-sm"></div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-space-xs">
              search
            </span>
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activePage !== "catalog") navigateTo("catalog");
              }}
              className="bg-transparent text-on-surface text-[12px] placeholder:text-outline focus:outline-none w-24 lg:w-36"
              aria-label="Search clothing catalog"
            />
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden text-on-surface flex items-center p-1"
            aria-label="Open search bar"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => {
              if (user) {
                navigateTo("account");
              } else {
                navigateTo("login", { role: "customer" });
              }
            }}
            className="relative text-on-surface flex items-center p-1 hover:text-secondary transition-colors"
            aria-label={
              wishlistCount > 0
                ? `Wishlist containing ${wishlistCount} saved ${wishlistCount === 1 ? "garment" : "garments"}`
                : "Wishlist empty"
            }
            title={wishlistCount > 0 ? `Wishlist (${wishlistCount})` : "Wishlist"}
          >
            <span className={`material-symbols-outlined text-[22px] ${wishlistCount > 0 ? "text-primary" : ""}`}>
              favorite
            </span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Bag Button */}
          <button
            onClick={() => navigateTo("cart")}
            className="relative text-on-surface flex items-center p-1 hover:text-secondary transition-colors"
            aria-label={
              cartCount > 0
                ? `Shopping bag containing ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                : "Shopping bag empty"
            }
            title={cartCount > 0 ? `Shopping Bag (${cartCount})` : "Shopping Bag"}
          >
            <span className="material-symbols-outlined text-[22px]">
              shopping_bag
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile / Account Control */}
          <div className="relative group">
            <button
              onClick={() => {
                if (user) {
                  navigateTo("account");
                } else {
                  navigateTo("login", { role: "customer" });
                }
              }}
              onMouseEnter={() => setProfileDropdownOpen(true)}
              className="flex items-center justify-center p-1 ml-space-xs text-on-surface hover:text-primary transition-colors focus:outline-none"
              aria-label={
                user
                  ? `Client profile for ${user.name} (${user.role}). Click to view account wardrobe.`
                  : "Sign in to CloudCloset account"
              }
              title={user ? `Account: ${user.name}` : "Sign In"}
            >
              <span className="material-symbols-outlined text-[24px]">
                {user ? "account_circle" : "person"}
              </span>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-surface-variant shadow-lg py-2 z-50 animate-fade-in"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-surface-variant">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">
                        Signed in as
                      </p>
                      <p className="text-[13px] font-medium text-primary truncate">
                        {user.name}
                      </p>
                      <span className="inline-block bg-secondary-container text-on-secondary-container text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigateTo("account");
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-medium text-primary hover:bg-surface-container-low flex items-center gap-2 uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        person
                      </span>
                      Wardrobe & Orders
                    </button>
                    {user.role === "Admin" && (
                      <button
                        onClick={() => {
                          navigateTo("admin");
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-[12px] font-medium text-primary hover:bg-surface-container-low flex items-center gap-2 uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          admin_panel_settings
                        </span>
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-medium text-error hover:bg-error-container/20 flex items-center gap-2 uppercase tracking-wider border-t border-surface-variant mt-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        logout
                      </span>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        navigateTo("login", { role: "customer" });
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-medium text-primary hover:bg-surface-container-low flex items-center gap-2 uppercase tracking-wider"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        login
                      </span>
                      Customer Sign In
                    </button>
                    <button
                      onClick={() => {
                        navigateTo("login", { role: "admin" });
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-medium text-primary hover:bg-surface-container-low flex items-center gap-2 uppercase tracking-wider border-t border-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        admin_panel_settings
                      </span>
                      Admin Portal
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="md:hidden px-margin-mobile pb-3 pt-1 border-t border-surface-variant bg-surface">
          <div className="flex items-center border border-surface-variant px-space-sm py-2 bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-space-xs">
              search
            </span>
            <input
              type="text"
              placeholder="Search shirts, linen coats, chinos..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activePage !== "catalog") navigateTo("catalog");
              }}
              className="bg-transparent text-on-surface text-[13px] placeholder:text-outline focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-outline text-xs">
                CLEAR
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-b border-surface-variant px-margin-mobile py-space-md flex flex-col gap-space-sm animate-fade-in shadow-xl">
          <button
            onClick={() => handleNavClick("shop")}
            className="text-left font-serif text-lg text-primary py-1 border-b border-surface-variant/40"
          >
            Home
          </button>
          <button
            onClick={() => handleNavClick("men")}
            className="text-left font-sans text-sm font-semibold tracking-widest uppercase text-on-surface py-1"
          >
            Men's Ready to Wear
          </button>
          <button
            onClick={() => handleNavClick("women")}
            className="text-left font-sans text-sm font-semibold tracking-widest uppercase text-on-surface py-1"
          >
            Women's Ready to Wear
          </button>
          <button
            onClick={() => handleNavClick("new-arrivals")}
            className="text-left font-sans text-sm font-semibold tracking-widest uppercase text-on-surface py-1"
          >
            New Arrivals (SS25)
          </button>
          <button
            onClick={() => handleNavClick("trending")}
            className="text-left font-sans text-sm font-semibold tracking-widest uppercase text-on-surface py-1"
          >
            Trending
          </button>
          <button
            onClick={() => handleNavClick("sale")}
            className="text-left font-sans text-sm font-semibold tracking-widest uppercase text-secondary font-bold py-1 flex items-center justify-between"
          >
            <span>Mid-Season Sale</span>
            <span className="text-[10px] bg-secondary text-white px-2 py-0.5 rounded-full">Up to 30%</span>
          </button>
          <div className="pt-2 border-t border-surface-variant flex gap-2">
            <button
              onClick={() => {
                if (user?.role === "Admin") {
                  navigateTo("admin");
                } else {
                  navigateTo("login", { role: "admin" });
                }
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs font-semibold uppercase tracking-wider border border-primary text-primary"
            >
              Admin Portal
            </button>
            <button
              onClick={() => {
                if (user) {
                  navigateTo("account");
                } else {
                  navigateTo("login", { role: "customer" });
                }
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs font-semibold uppercase tracking-wider bg-primary text-white"
            >
              {user ? "Client Wardrobe" : "Sign In"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
