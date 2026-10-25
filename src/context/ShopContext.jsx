import React, { createContext, useContext, useState, useEffect } from "react";
import { initialProducts, mockOrders } from "../data/products";
import { api } from "../services/api";

const ShopContext = createContext(null);

const parseUrlRoute = () => {
  if (typeof window === "undefined") {
    return { page: "role-selection", role: "customer" };
  }
  const path = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const roleParam = searchParams.get("role");

  if (path === "/" || path === "") {
    return { page: "role-selection", role: "customer" };
  }
  if (path === "/login" || path.startsWith("/login")) {
    return { page: "login", role: roleParam === "admin" ? "admin" : "customer" };
  }
  if (path === "/shop" || path.startsWith("/shop") || path === "/home") {
    return { page: "shop", role: null };
  }
  if (path === "/catalog" || path.startsWith("/catalog")) {
    return { page: "catalog", role: null };
  }
  if (path === "/detail" || path.startsWith("/detail") || path === "/product") {
    return { page: "detail", role: null };
  }
  if (path === "/cart" || path.startsWith("/cart")) {
    return { page: "cart", role: null };
  }
  if (path === "/checkout" || path.startsWith("/checkout")) {
    return { page: "checkout", role: null };
  }
  if (path === "/account" || path.startsWith("/account")) {
    return { page: "account", role: null };
  }
  if (path === "/admin" || path.startsWith("/admin")) {
    return { page: "admin", role: null };
  }
  return { page: "role-selection", role: "customer" };
};

export function ShopProvider({ children }) {
  const initialRoute = parseUrlRoute();

  // Navigation & Page State
  const [activePage, setActivePageState] = useState(initialRoute.page);
  const [authRole, setAuthRole] = useState(initialRoute.role || "customer");
  const [selectedProduct, setSelectedProduct] = useState(initialProducts[0]);
  
  // Catalog filtering
  const [genderFilter, setGenderFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Products Database
  const [products, setProducts] = useState(initialProducts);


  // Cart State (pre-populated with items)
  const [cart, setCart] = useState([
    {
      id: "cart-item-1",
      product: initialProducts[0],
      selectedColor: initialProducts[0].colors[0],
      selectedSize: "M",
      quantity: 1
    },
    {
      id: "cart-item-2",
      product: initialProducts[2],
      selectedColor: initialProducts[2].colors[0],
      selectedSize: "32",
      quantity: 1
    }
  ]);

  // Wishlist State
  const [wishlist, setWishlist] = useState(["cc-001", "cc-006"]);

  // Coupon Engine
  const [appliedCoupon, setAppliedCoupon] = useState({
    code: "STYLE10",
    discountPercent: 10,
    label: "10% OFF APPLIED"
  });

  // User Auth State - Default unauthenticated guest for genuine role selection
  const [user, setUser] = useState(null);

  // Admin orders
  const [orders, setOrders] = useState(mockOrders);

  // Modals
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // URL Navigation Engine
  const navigateTo = (page, params = {}) => {
    let targetPath = "/";
    let targetPage = page;
    let targetRole = authRole;

    if (page === "role-selection" || page === "/") {
      targetPage = "role-selection";
      targetPath = "/";
    } else if (page === "login") {
      targetPage = "login";
      targetRole = params.role || authRole || "customer";
      setAuthRole(targetRole);
      targetPath = `/login?role=${targetRole}`;
    } else if (page === "shop" || page === "home") {
      targetPage = "shop";
      targetPath = "/shop";
    } else if (page === "catalog") {
      targetPage = "catalog";
      targetPath = "/catalog";
    } else if (page === "detail") {
      targetPage = "detail";
      targetPath = "/detail";
    } else if (page === "cart") {
      targetPage = "cart";
      targetPath = "/cart";
    } else if (page === "checkout") {
      targetPage = "checkout";
      targetPath = "/checkout";
    } else if (page === "account") {
      targetPage = "account";
      targetPath = "/account";
    } else if (page === "admin") {
      targetPage = "admin";
      targetPath = "/admin";
    } else {
      targetPage = page;
      targetPath = `/${page}`;
    }

    setActivePageState(targetPage);

    if (typeof window !== "undefined") {
      const currentFull = window.location.pathname + window.location.search;
      if (currentFull !== targetPath) {
        window.history.pushState({ page: targetPage, role: targetRole }, "", targetPath);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Backwards compatible alias
  const setActivePage = (page, params = {}) => {
    navigateTo(page, params);
  };

  // Handle browser back / forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlRoute();
      setActivePageState(parsed.page);
      if (parsed.role) {
        setAuthRole(parsed.role);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Hydrate user session and product catalogue from backend API
  useEffect(() => {
    let isMounted = true;

    // Check existing session
    api.auth.me()
      .then((data) => {
        if (isMounted && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Unauthenticated or offline: proceed as guest
      });

    // Fetch live catalogue from database
    api.products.getAll()
      .then((data) => {
        if (isMounted && data?.products && data.products.length > 0) {
          setProducts(data.products);
          setSelectedProduct(data.products[0]);
        }
      })
      .catch(() => {
        // Offline: preserve curated initialProducts
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const cartDiscount = appliedCoupon ? Math.round(cartSubtotal * (appliedCoupon.discountPercent / 100)) : 0;
  const isFreeShipping = cartSubtotal >= 1999 || cart.length === 0;
  const cartShipping = isFreeShipping ? 0 : 150;
  const cartTax = Math.round((cartSubtotal - cartDiscount) * 0.12); // 12% GST
  const cartTotal = cartSubtotal - cartDiscount + cartTax + cartShipping;

  const addToCart = (product, color = null, size = "M", quantity = 1) => {
    const chosenColor = color || product.colors[0];
    const existingIndex = cart.findIndex(
      (item) => item.product.id === product.id && item.selectedSize === size && item.selectedColor?.name === chosenColor?.name
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      const newItem = {
        id: `cart-item-${Date.now()}`,
        product,
        selectedColor: chosenColor,
        selectedSize: size,
        quantity
      };
      setCart([newItem, ...cart]);
    }
    showToast(`Added "${product.name}" to Bag`);
  };

  const removeFromCart = (cartItemId) => {
    const item = cart.find((i) => i.id === cartItemId);
    setCart(cart.filter((item) => item.id !== cartItemId));
    if (item) {
      showToast(`Removed "${item.product.name}" from Bag`, "info");
    }
  };

  const updateCartQty = (cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const applyCouponCode = (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (code === "STYLE10" || code === "CLOUD10" || code === "SS25") {
      setAppliedCoupon({
        code,
        discountPercent: 10,
        label: "10% OFF APPLIED"
      });
      showToast(`Voucher ${code} applied successfully!`);
      return { success: true, message: "10% discount applied." };
    } else if (code === "CLOUD20") {
      setAppliedCoupon({
        code,
        discountPercent: 20,
        label: "20% PRIVILEGE APPLIED"
      });
      showToast(`Voucher ${code} applied! 20% savings.`);
      return { success: true, message: "20% discount applied." };
    } else {
      showToast("Invalid promo voucher code.", "error");
      return { success: false, message: "Invalid voucher code." };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast("Voucher removed.");
  };

  const toggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      setWishlist(wishlist.filter((id) => id !== productId));
      showToast("Removed from Wishlist", "info");
    } else {
      setWishlist([...wishlist, productId]);
      showToast("Saved to Wishlist");
    }
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  const navigateToProduct = (product) => {
    setSelectedProduct(product);
    navigateTo("detail");
  };

  const navigateToCategory = (gender, category = "All") => {
    setGenderFilter(gender);
    setCategoryFilter(category);
    navigateTo("catalog");
  };

  // Auth functions
  const signIn = async (email, password, role = "customer") => {
    try {
      const res = await api.auth.login(email, password, role);
      if (res?.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      // If server error is specific (like 401 or 403), rethrow to let LoginPage display exact error message
      if (!err.isNetworkError && err.data?.error) {
        throw new Error(err.data.error);
      }
      // Offline fallback: graceful simulation
      const isEmailAdmin = role === "admin" || email.toLowerCase().includes("admin");
      const fallbackUser = {
        name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        email,
        role: isEmailAdmin ? "Admin" : "Member",
        avatar: null
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const signUp = async (name, email, phone, password) => {
    try {
      const res = await api.auth.register(name, email, phone, password);
      if (res?.user) {
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      if (!err.isNetworkError && err.data?.error) {
        throw new Error(err.data.error);
      }
      const fallbackUser = {
        name,
        email,
        phone,
        role: "Member",
        avatar: null
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const signOut = () => {
    api.auth.logout();
    setUser(null);
    showToast("Signed out successfully.");
    navigateTo("role-selection");
  };

  // Admin functions
  const addProduct = async (newProduct) => {
    try {
      const res = await api.admin.createProduct(newProduct);
      if (res?.product) {
        setProducts([res.product, ...products]);
        showToast(`Garment "${newProduct.name}" added to catalog.`);
        return res.product;
      }
    } catch (_err) {
      // Offline fallback
    }
    const product = {
      ...newProduct,
      id: `cc-${Date.now().toString().slice(-4)}`,
      rating: 5.0,
      reviewCount: 1,
      inStock: true
    };
    setProducts([product, ...products]);
    showToast(`Garment "${product.name}" added to catalog.`);
    return product;
  };

  const updateProductStock = async (id, newStock) => {
    try {
      await api.admin.updateStock(id, newStock);
    } catch (_err) {
      // Handled locally
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p))
    );
    showToast("Stock quantity updated.");
  };

  const deleteProduct = async (id) => {
    try {
      await api.admin.deleteProduct(id);
    } catch (_err) {
      // Handled locally
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast("Product deleted from atelier inventory.", "info");
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.admin.updateOrderStatus(orderId, newStatus);
    } catch (_err) {
      // Handled locally
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showToast(`Order ${orderId} marked as ${newStatus}.`);
  };

  return (
    <ShopContext.Provider
      value={{
        activePage,
        setActivePage,
        authRole,
        setAuthRole,
        navigateTo,
        selectedProduct,
        setSelectedProduct,
        navigateToProduct,
        navigateToCategory,
        genderFilter,
        setGenderFilter,
        categoryFilter,
        setCategoryFilter,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        products,
        cart,
        addToCart,
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
        wishlist,
        toggleWishlist,
        isWishlisted,
        user,
        signIn,
        signUp,
        signOut,
        quickViewProduct,
        setQuickViewProduct,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        toast,
        showToast,
        orders,
        addProduct,
        updateProductStock,
        deleteProduct,
        updateOrderStatus
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
