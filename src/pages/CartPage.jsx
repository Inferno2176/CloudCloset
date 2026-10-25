import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import ProductImage from "../components/ProductImage";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateCartQty,
    cartSubtotal,
    cartDiscount,
    cartTax,
    cartShipping,
    cartTotal,
    isFreeShipping,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    setActivePage,
    navigateToProduct
  } = useShop();

  const [promoInput, setPromoInput] = useState("");
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const handleApply = (e) => {
    e.preventDefault();
    if (promoInput.trim()) {
      applyCouponCode(promoInput);
      setPromoInput("");
    }
  };

  const handleCheckout = () => {
    setActivePage("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full bg-surface pb-space-2xl">
      {/* Header & Breadcrumb */}
      <section className="w-full px-margin-mobile lg:px-margin pt-space-md pb-space-lg">
        <nav className="flex items-center gap-space-xs mb-space-sm text-on-surface-variant font-sans text-[11px] uppercase tracking-wider">
          <button
            onClick={() => setActivePage("home")}
            className="hover:text-primary transition-colors"
          >
            Home
          </button>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-bold">Shopping Bag</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-surface-variant pb-space-md">
          <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
            Your Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h1>
          <button
            onClick={() => setActivePage("catalog")}
            className="text-xs font-semibold uppercase tracking-wider text-secondary hover:underline flex items-center gap-1"
          >
            Continue Curating <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Main Cart Body */}
      <section className="w-full px-margin-mobile lg:px-margin mt-space-sm">
        {cart.length === 0 ? (
          <div className="max-w-xl mx-auto py-space-2xl text-center bg-surface-container-low border border-surface-variant p-space-xl">
            <span className="material-symbols-outlined text-5xl text-outline mb-space-sm">
              shopping_bag
            </span>
            <h2 className="font-serif text-2xl text-primary font-medium">Your shopping bag is empty</h2>
            <p className="font-sans text-xs text-on-surface-variant mt-2 max-w-sm mx-auto leading-relaxed">
              Explore our current SS25 architectural collection and add garments to begin your private order.
            </p>
            <button
              onClick={() => setActivePage("catalog")}
              className="mt-space-lg bg-primary text-on-primary px-space-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Left 7 Columns: Items & Vouchers */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              {/* Free Shipping Milestone Alert */}
              <div className="bg-surface-container-low border border-surface-variant p-space-md flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    local_shipping
                  </span>
                  <div>
                    <p className="font-sans text-xs font-bold uppercase tracking-wider text-primary">
                      {isFreeShipping
                        ? "Complimentary Express Shipping Unlocked"
                        : `Add ₹${(1999 - cartSubtotal).toLocaleString("en-IN")} more for Free Express Delivery`}
                    </p>
                    <p className="font-sans text-[11px] text-on-surface-variant">
                      Direct courier dispatch from Mumbai/Bengaluru ateliers within 24 hours.
                    </p>
                  </div>
                </div>
                {isFreeShipping && (
                  <span className="text-[10px] font-bold text-secondary bg-secondary-fixed/50 px-2 py-0.5 uppercase tracking-widest shrink-0">
                    Active
                  </span>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex flex-col gap-space-md">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface-container-lowest border border-surface-variant p-space-md sm:p-space-lg flex flex-col sm:flex-row gap-space-md"
                  >
                    {/* Item Thumbnail */}
                    <div
                      onClick={() => navigateToProduct(item.product)}
                      className="w-full sm:w-28 aspect-[3/4] bg-surface-container overflow-hidden shrink-0 cursor-pointer border border-surface-variant"
                    >
                      <ProductImage
                        product={item.product}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-outline block">
                              {item.product.category} · {item.product.gender}
                            </span>
                            <h3
                              onClick={() => navigateToProduct(item.product)}
                              className="font-serif text-lg sm:text-xl text-primary font-medium hover:text-secondary cursor-pointer mt-0.5"
                            >
                              {item.product.name}
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-sans text-base sm:text-lg font-bold text-primary">
                              ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[11px] text-outline block">
                                (₹{item.product.price} each)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attribute Pills */}
                        <div className="flex flex-wrap items-center gap-space-xs mt-3">
                          <span className="text-[11px] bg-surface-container px-2.5 py-1 uppercase text-on-surface">
                            Shade: <strong className="text-primary font-semibold">{item.selectedColor?.name || "Natural"}</strong>
                          </span>
                          <span className="text-[11px] bg-surface-container px-2.5 py-1 uppercase text-on-surface">
                            Size: <strong className="text-primary font-semibold">{item.selectedSize}</strong>
                          </span>
                          <span className="text-[10px] font-bold bg-secondary-container/40 text-on-secondary-container px-2 py-0.5 uppercase tracking-wider">
                            Ready to Ship
                          </span>
                        </div>
                      </div>

                      {/* Stepper Controls & Delete Actions */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-surface-variant/40">
                        {/* Stepper */}
                        <div className="flex items-center border border-surface-variant bg-surface-container-low p-0.5">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors text-sm font-bold"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-primary">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors text-sm font-bold"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-space-md">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 text-xs"
                            title="Remove item from bag"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promotions & Coupons Accordion Box */}
              <div className="bg-surface-container-lowest border border-surface-variant p-space-md sm:p-space-lg flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[20px]">sell</span>
                    <h3 className="font-sans text-xs uppercase tracking-wider text-primary font-bold">
                      Privilege Offers & Vouchers
                    </h3>
                  </div>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      1 Active
                    </span>
                  )}
                </div>

                {/* Applied Voucher Card */}
                {appliedCoupon && (
                  <div className="bg-secondary-container/30 border border-secondary/30 p-space-md flex items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        check_circle
                      </span>
                      <div>
                        <p className="font-sans text-xs uppercase tracking-wider text-on-surface font-bold">
                          {appliedCoupon.code} <span className="text-secondary">({appliedCoupon.label})</span>
                        </p>
                        <p className="font-sans text-[11px] text-on-secondary-container">
                          ₹{cartDiscount.toLocaleString("en-IN")} savings successfully deducted from total
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs uppercase text-on-surface-variant hover:text-error transition-colors font-bold px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Promo Input Form */}
                <form onSubmit={handleApply} className="flex flex-col sm:flex-row items-center gap-space-xs">
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                      redeem
                    </span>
                    <input
                      type="text"
                      placeholder="ENTER COUPON (TRY 'STYLE10' OR 'CLOUD10')"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface text-xs uppercase tracking-wider pl-10 pr-4 py-2.5 border border-surface-variant focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-primary text-on-primary hover:bg-secondary transition-colors px-6 py-2.5 text-xs font-bold uppercase tracking-widest shrink-0"
                  >
                    Apply
                  </button>
                </form>
              </div>

              {/* Protection & Assurance Strip */}
              <div className="bg-surface-container-low border border-surface-variant p-space-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md text-left">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary border border-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <div>
                      <h4 className="font-sans text-[11px] tracking-wider uppercase text-primary font-bold">256-Bit SSL Safe</h4>
                      <p className="font-sans text-[10px] text-on-surface-variant">Secured bank payment gateway</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary border border-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                    </div>
                    <div>
                      <h4 className="font-sans text-[11px] tracking-wider uppercase text-primary font-bold">15-Day Doorstep</h4>
                      <p className="font-sans text-[10px] text-on-surface-variant">Complimentary return pickup</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary border border-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">award_star</span>
                    </div>
                    <div>
                      <h4 className="font-sans text-[11px] tracking-wider uppercase text-primary font-bold">100% Authentic</h4>
                      <p className="font-sans text-[10px] text-on-surface-variant">Ethical Indian provenance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Sticky Order Summary */}
            <div className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-28">
              <div className="bg-surface-container-lowest border border-surface-variant p-space-lg shadow-sm">
                <h2 className="font-serif text-2xl text-primary font-normal pb-space-sm border-b border-surface-variant">
                  Order Summary
                </h2>

                <div className="space-y-space-sm text-xs font-sans py-space-md border-b border-surface-variant">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-primary">₹{cartSubtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex items-center justify-between text-secondary font-semibold">
                      <span>Voucher Savings ({appliedCoupon?.code})</span>
                      <span>-₹{cartDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Estimated GST (12%)</span>
                    <span>₹{cartTax.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span>Express Dispatch</span>
                    <span>
                      {cartShipping === 0 ? (
                        <strong className="text-secondary font-bold">FREE</strong>
                      ) : (
                        `₹${cartShipping}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Final Total */}
                <div className="flex items-baseline justify-between py-space-md">
                  <div>
                    <span className="font-serif text-xl text-primary font-medium block">Total Payable</span>
                    <span className="text-[10px] text-outline uppercase tracking-wider">Including All Taxes</span>
                  </div>
                  <span className="font-sans text-2xl font-bold text-primary">
                    ₹{cartTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Primary Checkout CTA */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-on-primary hover:bg-secondary py-3.5 px-space-lg font-sans text-xs font-bold uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Proceed to Secure Checkout</span>
                </button>

                {/* Payment Methods Badges */}
                <div className="mt-space-md pt-space-sm border-t border-surface-variant/40 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    Instant Bank & UPI Verification
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-outline">
                    <span className="border border-surface-variant px-2 py-0.5">Google Pay</span>
                    <span className="border border-surface-variant px-2 py-0.5">PhonePe</span>
                    <span className="border border-surface-variant px-2 py-0.5">Credit Card</span>
                    <span className="border border-surface-variant px-2 py-0.5">EMI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Checkout Simulated Dialog */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface max-w-lg w-full border border-surface-variant p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-primary hover:text-secondary"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">
              Secure Gateway Simulation
            </span>
            <h3 className="font-serif text-2xl text-primary font-medium mb-3">
              Confirm Atelier Dispatch
            </h3>

            <div className="bg-surface-container-low p-3 mb-4 text-xs text-on-surface space-y-1">
              <p><strong>Total Amount:</strong> ₹{cartTotal.toLocaleString("en-IN")}</p>
              <p><strong>Delivery Address:</strong> Kala Ghoda Atelier / Mumbai Express</p>
              <p><strong>Payment Method:</strong> UPI (Verified Seamless)</p>
            </div>

            <p className="text-xs text-outline mb-6 leading-relaxed">
              This is a demonstration sandbox. Clicking confirm will simulate payment authorization and clear your cart.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="flex-1 border border-surface-variant text-primary py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                onClick={confirmOrder}
                className="flex-1 bg-primary text-white py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-secondary"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
