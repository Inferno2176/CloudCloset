import React, { useState } from "react";
import { useShop } from "../context/ShopContext";

export default function Footer() {
  const { navigateToCategory, setActivePage, showToast, setIsSizeGuideOpen } = useShop();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      showToast("Thank you for joining the CloudCloset Collective.");
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#111111] text-[#faf9f6] pt-space-2xl pb-space-xl border-t border-surface-variant">
      <div className="max-w-[1720px] mx-auto px-margin-mobile lg:px-margin">
        {/* Top Newsletter & Manifesto Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter pb-space-2xl border-b border-[#222222]">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-space-sm mb-space-sm">
                <span className="w-2 h-2 bg-secondary inline-block"></span>
                <span className="font-sans text-[11px] font-semibold uppercase tracking-widest text-outline">
                  Private Capsule Dispatch
                </span>
              </div>
              <h2 className="font-serif text-3xl lg:text-4xl font-normal tracking-tight text-[#faf9f6] max-w-lg">
                Deliberate, Quiet, and Architectonic Fashion.
              </h2>
              <p className="font-sans text-sm text-[#888888] mt-space-sm max-w-xl leading-relaxed">
                Join our private editorial circulation for priority invitations to archival releases, salon previews, and bespoke textile essays.
              </p>
            </div>

            {/* Atelier Locations */}
            <div className="grid grid-cols-3 gap-space-md mt-space-xl pt-space-md border-t border-[#222222]">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-outline">Atelier I</p>
                <p className="text-xs text-[#faf9f6] font-medium mt-1">Kala Ghoda, Mumbai</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-outline">Atelier II</p>
                <p className="text-xs text-[#faf9f6] font-medium mt-1">Connaught Place, Delhi</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-outline">Salon III</p>
                <p className="text-xs text-[#faf9f6] font-medium mt-1">Rue Saint-Honoré, Paris</p>
              </div>
            </div>
          </div>

          {/* Right Column: Newsletter Form */}
          <div className="lg:col-span-5 flex flex-col justify-center mt-space-lg lg:mt-0">
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-space-xs">
              <label htmlFor="footer-email" className="text-[11px] font-semibold uppercase tracking-widest text-[#aaaaaa]">
                Member Registration
              </label>
              <div className="flex items-center border border-[#333333] bg-[#1a1c1a] focus-within:border-[#faf9f6] transition-colors p-1">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="atelier@cloudcloset.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-transparent px-space-md py-3 text-sm text-[#faf9f6] placeholder:text-[#555555] focus:outline-none flex-1 font-sans"
                />
                <button
                  type="submit"
                  className="bg-[#faf9f6] text-[#111111] hover:bg-secondary hover:text-white px-space-lg py-3 text-xs font-bold uppercase tracking-widest transition-colors shrink-0"
                >
                  Join
                </button>
              </div>
              <p className="text-[11px] text-[#666666] mt-1">
                Zero promotional spam. Unsubscribe anytime with single click.
              </p>
            </form>
          </div>
        </div>

        {/* Links Navigation Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter py-space-2xl border-b border-[#222222]">
          {/* Column 1: Collections */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#faf9f6] mb-space-md">
              Collections
            </h3>
            <ul className="space-y-space-sm text-xs font-sans text-[#888888]">
              <li>
                <button onClick={() => navigateToCategory("Men")} className="hover:text-[#faf9f6] transition-colors">
                  Men's Ready to Wear
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory("Women")} className="hover:text-[#faf9f6] transition-colors">
                  Women's Tailoring
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory("All", "New Arrivals")} className="hover:text-[#faf9f6] transition-colors">
                  Spring / Summer 2025 Drop
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory("All", "Outerwear")} className="hover:text-[#faf9f6] transition-colors">
                  Belgian Linen Outerwear
                </button>
              </li>
              <li>
                <button onClick={() => navigateToCategory("All", "Sale")} className="hover:text-[#faf9f6] text-secondary transition-colors font-medium">
                  Curated Archive Sale
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Client Concierge */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#faf9f6] mb-space-md">
              Client Concierge
            </h3>
            <ul className="space-y-space-sm text-xs font-sans text-[#888888]">
              <li>
                <button onClick={() => setIsSizeGuideOpen(true)} className="hover:text-[#faf9f6] transition-colors">
                  Architectural Sizing Chart
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage("catalog")} className="hover:text-[#faf9f6] transition-colors">
                  Express Delivery Across India
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage("cart")} className="hover:text-[#faf9f6] transition-colors">
                  Complimentary 15-Day Pickup
                </button>
              </li>
              <li>
                <a href="mailto:concierge@cloudcloset.in" className="hover:text-[#faf9f6] transition-colors">
                  Private Salon Appointments
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Atelier Provenance */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#faf9f6] mb-space-md">
              Provenance
            </h3>
            <ul className="space-y-space-sm text-xs font-sans text-[#888888]">
              <li>
                <span className="text-[#cccccc]">GOTS Certified Organic</span>
              </li>
              <li>
                <span className="text-[#cccccc]">Normandy Flax Guild</span>
              </li>
              <li>
                <span className="text-[#cccccc]">Artisanal Button Carving</span>
              </li>
              <li>
                <span className="text-[#cccccc]">Circular Packaging (100% Recycled)</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Portal & Governance */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#faf9f6] mb-space-md">
              Atelier Portal
            </h3>
            <ul className="space-y-space-sm text-xs font-sans text-[#888888]">
              <li>
                <button onClick={() => setActivePage("auth")} className="hover:text-[#faf9f6] transition-colors">
                  Member Private Portal
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage("admin")} className="hover:text-[#faf9f6] text-secondary font-semibold transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  Admin Operations Console
                </button>
              </li>
              <li>
                <span className="text-[#666666]">GSTIN: 27AABCC1234D1Z8</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Legal & Indian Payment Methods */}
        <div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md text-[11px] text-[#666666]">
          <p>© {new Date().getFullYear()} CloudCloset Atelier Studio. All rights reserved. Architectural Editorial Commerce.</p>
          
          <div className="flex items-center gap-space-md">
            <span className="tracking-wider uppercase text-[#888888]">Secure Encrypted Checkout</span>
            <div className="flex items-center gap-2 text-xs text-[#aaaaaa]">
              <span className="border border-[#333333] px-2 py-0.5 rounded text-[10px]">UPI</span>
              <span className="border border-[#333333] px-2 py-0.5 rounded text-[10px]">VISA</span>
              <span className="border border-[#333333] px-2 py-0.5 rounded text-[10px]">MASTERCARD</span>
              <span className="border border-[#333333] px-2 py-0.5 rounded text-[10px]">RUPAY</span>
              <span className="border border-[#333333] px-2 py-0.5 rounded text-[10px]">NETBANKING</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
