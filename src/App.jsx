import React from "react";
import { ShopProvider, useShop } from "./context/ShopContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import QuickViewModal from "./components/QuickViewModal";
import SizeGuideModal from "./components/SizeGuideModal";
import Toast from "./components/Toast";

import RoleSelectionPage from "./pages/RoleSelectionPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProductListingPage from "./pages/ProductListingPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminDashboard from "./pages/AdminDashboard";

function MainContent() {
  const { activePage } = useShop();

  const isAuthEntry = activePage === "role-selection" || activePage === "login";

  if (isAuthEntry) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#111111]">
        {activePage === "role-selection" && <RoleSelectionPage />}
        {activePage === "login" && <LoginPage />}
        <Toast />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Header />
      
      {/* Dynamic Main Body Content with padding top to account for clean fixed header */}
      <main className="flex-1 pt-20">
        {(activePage === "shop" || activePage === "home") && <HomePage />}
        {activePage === "catalog" && <ProductListingPage />}
        {activePage === "detail" && <ProductDetailPage />}
        {activePage === "cart" && <CartPage />}
        {activePage === "auth" && <LoginPage />}
        {activePage === "account" && <CustomerAccountPage />}
        {activePage === "checkout" && <CheckoutPage />}
        {activePage === "admin" && <AdminDashboard />}
      </main>

      <Footer />
      
      {/* Global Modals & Notifications */}
      <QuickViewModal />
      <SizeGuideModal />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <MainContent />
    </ShopProvider>
  );
}
