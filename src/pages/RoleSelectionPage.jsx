import React from "react";
import { useShop } from "../context/ShopContext";

export default function RoleSelectionPage() {
  const { navigateTo } = useShop();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex flex-col justify-between font-sans">
      {/* Refined Brand Header */}
      <header className="w-full py-8 px-6 text-center border-b border-[#E8E6E1]">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <span className="font-serif text-3xl sm:text-4xl uppercase tracking-wider text-[#111111] font-medium select-none">
            CloudCloset
          </span>
          <p className="font-sans text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#5B614E] mt-1.5">
            Minimalist Luxury Fashion Atelier
          </p>
        </div>
      </header>

      {/* Main Content: Role Selection */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12 lg:py-16">
        <div className="w-full max-w-4xl lg:max-w-5xl mx-auto">
          {/* Section Heading */}
          <div className="text-center mb-10 lg:mb-14">
            <span className="inline-block font-sans text-[11px] font-bold uppercase tracking-widest text-[#5B614E] mb-2">
              Atelier Portal Access
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#111111] tracking-tight">
              Welcome to CloudCloset
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#444748] mt-2.5 font-light">
              Choose how you'd like to continue.
            </p>
          </div>

          {/* Balanced Two-Card Role Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Customer Role Card */}
            <div className="group bg-[#FFFFFF] border border-[#E8E6E1] p-6 sm:p-8 flex flex-col justify-between hover:border-[#111111] transition-all duration-200">
              <div>
                {/* Fashion Visual */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB] border border-[#E8E6E1] mb-6">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBteu3t42MCxwuTk2d6CB689VNYa8ZokE_AN65IsfbO-kggMM3ZjUotvLeM6RTDzCd43Jk9Oj-_tOhQd5IDWM587eO_sDigxtdjkCsMNK-DHCSSLwdTR1YCrXoxdL1m-O_-lOrbsg7_NGvN14bbcG5N9kNYfZDdw6DSPHS9OlOqUosKAJd_utpn7uCZVXmdqzpse6USoDVUwtIx8qIcEchtTXuELf1IwZikAWXr0ggTU7oN6jggkJwqkg"
                    alt="Editorial silhouette of modern high-fashion apparel"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-3 left-3 bg-[#FAF9F6]/95 backdrop-blur-sm px-2.5 py-1 border border-[#E8E6E1]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B614E]">
                      Client Experience
                    </span>
                  </div>
                </div>

                {/* Card Typography */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#5B614E]">
                      shopping_bag
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#747878]">
                      Customer Access
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl lg:text-3xl font-medium text-[#111111]">
                    Continue as Customer
                  </h2>
                </div>

                <p className="font-sans text-xs sm:text-sm text-[#444748] leading-relaxed mb-8">
                  Discover collections, explore styles, and shop your favourites. Access bespoke client tailoring, saved wishlists, and seamless express order checkout.
                </p>
              </div>

              {/* Action CTA */}
              <button
                onClick={() => navigateTo("login", { role: "customer" })}
                className="w-full bg-[#111111] text-[#FAF9F6] py-4 px-6 font-sans text-xs font-bold uppercase tracking-widest hover:bg-[#5B614E] transition-colors flex items-center justify-center gap-2 group-hover:shadow-sm"
                aria-label="Continue as Customer — Customer Login"
              >
                <span>CUSTOMER LOGIN</span>
                <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* Admin Role Card */}
            <div className="group bg-[#FFFFFF] border border-[#E8E6E1] p-6 sm:p-8 flex flex-col justify-between hover:border-[#111111] transition-all duration-200">
              <div>
                {/* Minimalist Administrative Illustration */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4F3F1] border border-[#E8E6E1] mb-6 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-center mb-3 group-hover:border-[#5B614E] transition-colors">
                    <span className="material-symbols-outlined text-[32px] text-[#5B614E]">
                      admin_panel_settings
                    </span>
                  </div>
                  <p className="font-serif text-sm text-[#111111] font-medium">
                    Atelier Governance & Logistics
                  </p>
                  <p className="font-sans text-[10px] text-[#747878] uppercase tracking-wider mt-1">
                    Authorized Personnel Only
                  </p>

                  <div className="absolute top-3 left-3 bg-[#FAF9F6]/95 backdrop-blur-sm px-2.5 py-1 border border-[#E8E6E1]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#111111]">
                      Store Operations
                    </span>
                  </div>
                </div>

                {/* Card Typography */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#5B614E]">
                      security
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#747878]">
                      Management Portal
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl lg:text-3xl font-medium text-[#111111]">
                    Continue as Admin
                  </h2>
                </div>

                <p className="font-sans text-xs sm:text-sm text-[#444748] leading-relaxed mb-8">
                  Manage products, inventory, orders, and store operations. Real-time atelier stock controls, order dispatches, and catalog merchandising.
                </p>
              </div>

              {/* Action CTA */}
              <button
                onClick={() => navigateTo("login", { role: "admin" })}
                className="w-full bg-transparent border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] py-4 px-6 font-sans text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                aria-label="Continue as Admin — Admin Login"
              >
                <span>ADMIN LOGIN</span>
                <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">
                  lock_open
                </span>
              </button>
            </div>
          </div>

          {/* Tertiary Guest Browsing Link */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigateTo("shop")}
              className="inline-flex items-center gap-1.5 text-xs font-sans text-[#747878] hover:text-[#111111] transition-colors uppercase tracking-widest font-semibold pb-1 border-b border-transparent hover:border-[#111111]"
            >
              <span>Explore collection as guest</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>

      {/* Refined Brand Footer */}
      <footer className="w-full py-6 px-6 border-t border-[#E8E6E1] text-center text-xs text-[#747878] font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] uppercase tracking-wider">
          <span>© 2025 CloudCloset Atelier. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[#5B614E] font-medium">
            <span>Bengaluru</span>
            <span>·</span>
            <span>Paris</span>
            <span>·</span>
            <span>Architectural Minimalism</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
