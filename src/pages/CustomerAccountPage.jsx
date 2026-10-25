import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import ProductCard from "../components/ProductCard";

export default function CustomerAccountPage() {
  const { user, signOut, wishlist, products, orders, navigateTo } = useShop();

  const [activeTab, setActiveTab] = useState("wishlist"); // "profile", "wishlist", or "orders"

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="w-full bg-surface pb-space-2xl">
      {/* Header Profile Stamp */}
      <section className="w-full px-margin-mobile lg:px-margin pt-space-md pb-space-lg">
        <nav className="flex items-center gap-space-xs mb-space-sm text-on-surface-variant font-sans text-[11px] uppercase tracking-wider">
          <button onClick={() => navigateTo("shop")} className="hover:text-primary transition-colors">
            Home
          </button>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-bold">Client Wardrobe</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-surface-variant pb-space-md">
          <div className="flex items-center gap-space-md">
            <div
              className="w-16 h-16 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-serif text-2xl font-medium border border-surface-variant shadow-sm select-none"
              aria-label={`Monogram avatar for ${user?.name || "Client"}`}
            >
              {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "CC"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl text-primary font-medium">
                  {user?.name || "Client Wardrobe"}
                </h1>
                <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {user?.role === "Admin" ? "Atelier Admin" : "CloudMember Gold"}
                </span>
              </div>
              <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                {user?.email || "Signed in Client"} · Member Since 2025
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "Admin" && (
              <button
                onClick={() => navigateTo("admin")}
                className="px-4 py-2 border border-surface-variant text-primary hover:bg-surface-container-low text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Admin Dashboard
              </button>
            )}
            <button
              onClick={signOut}
              className="px-4 py-2 bg-surface-container-low text-error hover:bg-error-container/20 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-variant mt-space-lg">
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`py-3 px-6 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "wishlist"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">favorite</span>
            Saved Wishlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-6 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            Order History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-6 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "profile"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            Atelier Profile & Addresses
          </button>
        </div>
      </section>

      {/* Main Tab Views */}
      <section className="w-full px-margin-mobile lg:px-margin mt-space-md">
        {activeTab === "wishlist" ? (
          <div>
            {wishlistedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
                {wishlistedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="py-space-2xl text-center bg-surface-container-low border border-surface-variant p-space-xl">
                <span className="material-symbols-outlined text-4xl text-outline mb-space-sm">
                  favorite_border
                </span>
                <h3 className="font-serif text-2xl text-primary font-normal">
                  Your Wishlist is Empty
                </h3>
                <p className="font-sans text-xs text-on-surface-variant mt-2 max-w-sm mx-auto leading-relaxed">
                  Browse our seasonal editorial lookbook and save garments you wish to allocate for future capsule drops.
                </p>
                <button
                  onClick={() => setActivePage("catalog")}
                  className="mt-space-md bg-primary text-on-primary px-space-xl py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
                >
                  Browse Catalog
                </button>
              </div>
            )}
          </div>
        ) : activeTab === "orders" ? (
          <div className="space-y-space-md">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-surface-container-lowest border border-surface-variant p-space-md sm:p-space-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-variant pb-space-sm mb-space-md">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-outline">
                      Order Reference
                    </span>
                    <h3 className="font-serif text-xl text-primary font-medium">{ord.id}</h3>
                    <p className="text-xs text-on-surface-variant">Placed on {ord.date} · Paid via {ord.payment}</p>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <span
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "Delivered"
                          ? "bg-secondary-container text-on-secondary-container"
                          : ord.status === "Shipped"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {ord.status}
                    </span>
                    <span className="font-sans text-base font-bold text-primary">
                      ₹{ord.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-surface-variant/40">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-primary">{item.name}</p>
                        <p className="text-[11px] text-outline">Size: {item.size} · Quantity: {item.qty}</p>
                      </div>
                      <span className="font-semibold text-primary">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                {/* Footer action */}
                <div className="mt-space-md pt-space-sm border-t border-surface-variant/40 flex items-center justify-between text-xs">
                  <span className="text-outline">Destination: {ord.destination}</span>
                  <button
                    onClick={() => alert(`Simulating tax invoice download for ${ord.id}...`)}
                    className="text-secondary hover:underline font-semibold flex items-center gap-1 uppercase tracking-wider text-[11px]"
                  >
                    <span className="material-symbols-outlined text-[15px]">download</span>
                    Download Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* PROFILE TAB */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {/* Personal info card */}
            <div className="bg-surface-container-lowest border border-surface-variant p-space-lg">
              <h3 className="font-serif text-xl text-primary font-normal mb-space-sm pb-space-xs border-b border-surface-variant">
                Personal Atelier Dossier
              </h3>
              <div className="space-y-space-sm text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline block">Full Name</span>
                  <p className="font-semibold text-primary text-sm mt-0.5">{user?.name || "Ananya Mehra"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline block">Registered Email</span>
                  <p className="font-semibold text-primary text-sm mt-0.5">{user?.email || "ananya.mehra@atelier.in"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline block">SMS Notification Phone</span>
                  <p className="font-semibold text-primary text-sm mt-0.5">+91 98765 43210</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-outline block">Sizing Silhouette</span>
                  <p className="font-semibold text-primary text-sm mt-0.5">Top: Medium · Bottom: 32 · Fit: Relaxed/Boxy</p>
                </div>
              </div>
            </div>

            {/* Saved addresses card */}
            <div className="bg-surface-container-lowest border border-surface-variant p-space-lg">
              <h3 className="font-serif text-xl text-primary font-normal mb-space-sm pb-space-xs border-b border-surface-variant">
                Saved Atelier Delivery Addresses
              </h3>
              <div className="space-y-space-md text-xs">
                <div className="bg-surface-container-low border border-surface-variant p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase text-[10px] tracking-wider text-secondary">
                      Primary Atelier · Residence
                    </span>
                    <span className="text-[10px] bg-secondary-container px-1.5 py-0.5 text-on-secondary-container font-semibold">
                      Default
                    </span>
                  </div>
                  <p className="font-medium text-primary">Ananya Mehra</p>
                  <p className="text-on-surface-variant mt-0.5">
                    Apt 14B, Ashoka Towers, Dr. Annie Besant Road, Worli, Mumbai, Maharashtra — 400018
                  </p>
                  <p className="text-outline text-[11px] mt-1">Phone: +91 98765 43210</p>
                </div>

                <div className="bg-surface-container-low border border-surface-variant p-3">
                  <span className="font-bold uppercase text-[10px] tracking-wider text-outline block mb-1">
                    Studio Address · Delhi
                  </span>
                  <p className="font-medium text-primary">Ananya Mehra (Design Studio)</p>
                  <p className="text-on-surface-variant mt-0.5">
                    Studio 4, Haus Khas Village Gallery Enclave, New Delhi — 110016
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
