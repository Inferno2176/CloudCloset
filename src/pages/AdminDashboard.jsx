import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import ProductImage from "../components/ProductImage";
import { api } from "../services/api";

export default function AdminDashboard() {
  const {
    user,
    products,
    addProduct,
    updateProductStock,
    deleteProduct,
    orders,
    updateOrderStatus,
    navigateTo,
    showToast
  } = useShop();

  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" or "orders"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  // Add Product Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Shirts");
  const [newGender, setNewGender] = useState("Men");
  const [newPrice, setNewPrice] = useState("");
  const [newOriginalPrice, setNewOriginalPrice] = useState("");
  const [newStock, setNewStock] = useState("15");
  const [newProvenance, setNewProvenance] = useState("100% GOTS Organic");
  const [newDescription, setNewDescription] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  // Handle local file image upload with backend / S3 streaming
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Stream image to backend Amazon S3 upload endpoint
      try {
        const uploadRes = await api.admin.uploadImage(file, 'new-garment', 'primary');
        if (uploadRes?.url || uploadRes?.s3Key) {
          setNewImageUrl(uploadRes.url || uploadRes.s3Key);
          showToast("Photograph uploaded to Amazon S3 storage.");
        }
      } catch (err) {
        console.warn("Backend S3 upload fallback to local preview:", err.message);
        setNewImageUrl(reader.result);
      }
    }
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newName || !newPrice) return;

    const newProd = {
      name: newName,
      slug: newName.toLowerCase().replace(/\s+/g, "-"),
      category: newCategory,
      gender: newGender,
      price: parseInt(newPrice) || 1999,
      originalPrice: parseInt(newOriginalPrice) || parseInt(newPrice) + 500,
      stockCount: parseInt(newStock) || 10,
      provenance: newProvenance,
      description: newDescription || "Engineered with architectural drape and premium natural textile fibers.",
      fabric: "100% Organic certified fibers. Loomed in artisanal partner ateliers.",
      care: "Dry clean or gentle cold wash cycle.",
      origin: "Crafted in Indian Atelier",
      colors: [
        { name: "Obsidian", hex: "#111111" },
        { name: "Alabaster", hex: "#FAF9F6" }
      ],
      sizes: [
        { size: "S", available: true },
        { size: "M", available: true },
        { size: "L", available: true },
        { size: "XL", available: true }
      ],
      images: [
        newImageUrl || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop"
      ]
    };

    addProduct(newProd);
    setIsAddModalOpen(false);
    // Reset form
    setNewName("");
    setNewPrice("");
    setNewOriginalPrice("");
    setNewImageUrl("");
    setImagePreview("");
    setNewDescription("");
  };

  // Edit Product Handlers
  const openEditModal = (product) => {
    setEditingProduct({ ...product });
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Update in products state
    updateProductStock(editingProduct.id, editingProduct.stockCount);
    setEditingProduct(null);
    showToast(`Updated "${editingProduct.name}" in catalog.`);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.gender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "All") return true;
    return o.status === orderStatusFilter;
  });

  const totalStock = products.reduce((sum, p) => sum + (p.stockCount || 0), 0);
  const lowStockCount = products.filter((p) => (p.stockCount || 0) < 15).length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0) + 248500;

  // Role Protection Guard - require verified admin role
  if (!user || user.role !== "Admin") {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center px-4 py-16 bg-surface">
        <div className="max-w-md w-full bg-surface-container-lowest border border-surface-variant p-8 text-center shadow-lg">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-error-container/30 border border-error/30 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[30px]">lock</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-error block mb-2">
            Access Restricted · 403 Forbidden
          </span>

          <h1 className="font-serif text-2xl sm:text-3xl text-primary font-medium mb-3">
            Admin Authorization Required
          </h1>

          <p className="font-sans text-xs text-on-surface-variant leading-relaxed mb-6">
            The Atelier Operations Dashboard is restricted to verified store administrators.
            {user
              ? ` Your current session is authenticated as a customer (${user.email}) and does not hold administrative permissions.`
              : " You are currently not signed in."}
            {" "}In production, server-side role verification protects this endpoint.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigateTo("login", { role: "admin" })}
              className="w-full bg-primary text-on-primary py-3.5 px-4 font-sans text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => navigateTo("shop")}
              className="w-full bg-surface-container-low border border-surface-variant text-primary py-3.5 px-4 font-sans text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface pb-space-2xl">
      {/* Header Bar */}
      <section className="w-full px-margin-mobile lg:px-margin pt-space-md pb-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm border-b border-surface-variant pb-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              Atelier Operations Console
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-primary font-normal">
              CloudCloset Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo("shop")}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-surface-variant text-primary hover:bg-surface-container-low transition-colors"
            >
              View Storefront
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-on-primary hover:bg-secondary px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add New Garment
            </button>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mt-space-lg">
          <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">
              Gross Merchandise Value
            </span>
            <div className="font-serif text-2xl lg:text-3xl font-medium text-primary">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] font-semibold text-secondary mt-1 inline-block">
              +14.8% vs previous month
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">
              Active Client Orders
            </span>
            <div className="font-serif text-2xl lg:text-3xl font-medium text-primary">
              {orders.length}
            </div>
            <span className="text-[11px] text-on-surface-variant mt-1 inline-block">
              All routed through express hub
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">
              Atelier Inventory Units
            </span>
            <div className="font-serif text-2xl lg:text-3xl font-medium text-primary">
              {totalStock}
            </div>
            <span className="text-[11px] text-on-surface-variant mt-1 inline-block">
              Across {products.length} capsule garments
            </span>
          </div>

          <div className="bg-surface-container-lowest border border-surface-variant p-space-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline block mb-1">
              Low Stock Alerts
            </span>
            <div className="font-serif text-2xl lg:text-3xl font-medium text-error">
              {lowStockCount}
            </div>
            <span className="text-[11px] font-semibold text-error mt-1 inline-block">
              Requires weaver replenishment
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-variant mt-space-xl">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-3 px-6 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "inventory"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            Garment Inventory ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-6 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            Dispatched Orders ({orders.length})
          </button>
        </div>
      </section>

      {/* Main Tab Content */}
      <section className="w-full px-margin-mobile lg:px-margin mt-space-md">
        {activeTab === "inventory" ? (
          <div>
            {/* Search filter bar */}
            <div className="flex items-center justify-between gap-space-sm mb-space-md bg-surface-container-lowest border border-surface-variant p-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="material-symbols-outlined text-outline text-[18px] ml-2">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter garments by name, category, or gender..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-xs text-primary focus:outline-none w-full"
                />
              </div>
              <span className="text-[11px] font-semibold text-outline uppercase tracking-wider mr-2">
                {filteredProducts.length} Results
              </span>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto border border-surface-variant bg-surface-container-lowest">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-surface-container-high text-primary uppercase font-bold tracking-wider text-[10px] border-b border-surface-variant">
                  <tr>
                    <th className="p-3">Piece</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Provenance</th>
                    <th className="p-3">In Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                      {/* Piece info */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 overflow-hidden border border-surface-variant shrink-0">
                            <ProductImage
                              product={p}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{p.name}</p>
                            <span className="text-[10px] text-outline uppercase tracking-wider">{p.gender}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 text-on-surface-variant font-medium">{p.category}</td>

                      {/* Price */}
                      <td className="p-3 font-semibold text-primary">₹{p.price.toLocaleString("en-IN")}</td>

                      {/* Provenance */}
                      <td className="p-3 text-on-surface-variant text-[11px]">{p.provenance || "Atelier Line"}</td>

                      {/* Stock Stepper */}
                      <td className="p-3">
                        <div className="flex items-center border border-surface-variant bg-surface w-fit p-0.5">
                          <button
                            onClick={() => updateProductStock(p.id, Math.max(0, (p.stockCount || 0) - 1))}
                            className="w-6 h-6 flex items-center justify-center hover:bg-surface-container-high text-primary font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-bold text-primary">{p.stockCount || 0}</span>
                          <button
                            onClick={() => updateProductStock(p.id, (p.stockCount || 0) + 1)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-surface-container-high text-primary font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-3">
                        {(p.stockCount || 0) > 15 ? (
                          <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            In Stock
                          </span>
                        ) : (p.stockCount || 0) > 0 ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Low Stock
                          </span>
                        ) : (
                          <span className="bg-error-container text-on-error-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      {/* Edit & Delete Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(p)}
                            className="text-on-surface-variant hover:text-primary transition-colors p-1"
                            title="Edit Garment Details"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="text-on-surface-variant hover:text-error transition-colors p-1"
                            title="Remove from catalog"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ORDERS TABLE */
          <div>
            {/* Filter by status */}
            <div className="flex items-center gap-2 mb-space-md">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Filter Status:</span>
              {["All", "Processing", "Shipped", "Delivered"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                    orderStatusFilter === st
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-container-lowest text-primary border-surface-variant hover:border-primary"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto border border-surface-variant bg-surface-container-lowest">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-surface-container-high text-primary uppercase font-bold tracking-wider text-[10px] border-b border-surface-variant">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-3 font-bold text-primary">{order.id}</td>
                      <td className="p-3">
                        <p className="font-semibold text-primary">{order.customer}</p>
                        <p className="text-[10px] text-outline">{order.email}</p>
                      </td>
                      <td className="p-3 text-on-surface-variant">{order.date}</td>
                      <td className="p-3 text-on-surface-variant">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="line-clamp-1">
                            {it.qty}x {it.name} ({it.size})
                          </div>
                        ))}
                      </td>
                      <td className="p-3 font-bold text-primary">₹{order.total.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-on-surface-variant text-[11px]">{order.payment}</td>
                      <td className="p-3 text-on-surface-variant text-[11px]">{order.destination}</td>
                      <td className="p-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border focus:outline-none cursor-pointer ${
                            order.status === "Delivered"
                              ? "bg-secondary-container text-on-secondary-container border-secondary/40"
                              : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-900 border-blue-300"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300"
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Add New Garment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface max-w-3xl w-full border border-surface-variant p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-primary hover:text-secondary"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">
              Atelier Catalog Addition
            </span>
            <h2 className="font-serif text-2xl font-normal text-primary mb-4">
              Add New Garment Piece
            </h2>

            <form onSubmit={handleCreateProduct} className="space-y-space-md text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                {/* Form fields */}
                <div className="md:col-span-2 space-y-space-md">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                      Garment Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sculpted Double-Faced Wool Coat"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-space-sm">
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                      >
                        <option value="Shirts">Shirts</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Trousers">Trousers</option>
                        <option value="Knitwear">Knitwear</option>
                        <option value="Dresses">Dresses</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                        Gender
                      </label>
                      <select
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value)}
                        className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-space-sm">
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                        Price (₹) <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="2490"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="3200"
                        value={newOriginalPrice}
                        onChange={(e) => setNewOriginalPrice(e.target.value)}
                        className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                        Initial Stock
                      </label>
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                      Provenance / Fabric Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% GOTS Normandy Flax"
                      value={newProvenance}
                      onChange={(e) => setNewProvenance(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                      Editorial Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Architectural drop silhouette loomed with natural ease..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Right Column: Image Upload & Live Preview */}
                <div className="border border-surface-variant p-3 bg-surface-container-low flex flex-col justify-between">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                      Garment Photograph (3:4)
                    </label>
                    <p className="text-[10px] text-outline mb-2">Upload image file or paste URL</p>

                    <div className="mb-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="text-[11px] text-outline file:mr-2 file:py-1 file:px-2 file:border file:border-surface-variant file:text-xs file:font-bold file:bg-surface file:text-primary hover:file:bg-surface-container-high"
                      />
                    </div>

                    <input
                      type="url"
                      placeholder="Or paste https:// image URL"
                      value={newImageUrl}
                      onChange={(e) => {
                        setNewImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full bg-surface-container-lowest border border-surface-variant px-2 py-1.5 text-xs text-primary focus:outline-none mb-3"
                    />

                    {/* Live Preview Box */}
                    <div className="relative aspect-[3/4] w-full bg-surface-container border border-surface-variant overflow-hidden flex items-center justify-center">
                      {imagePreview || newImageUrl ? (
                        <img
                          src={imagePreview || newImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-outline">
                          <span className="material-symbols-outlined text-3xl">image</span>
                          <span className="text-[10px] block mt-1 uppercase font-semibold">Live 3:4 Preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 border border-surface-variant py-2.5 uppercase font-bold text-primary hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2.5 uppercase font-bold tracking-widest hover:bg-secondary"
                >
                  Publish to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Garment Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface max-w-xl w-full border border-surface-variant p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-primary hover:text-secondary"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">
              Atelier Inventory Editing
            </span>
            <h2 className="font-serif text-2xl font-normal text-primary mb-4">
              Edit {editingProduct.name}
            </h2>

            <form onSubmit={handleUpdateProduct} className="space-y-space-md text-xs font-sans">
              <div>
                <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                  Garment Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                    Stock Units
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stockCount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold uppercase tracking-wider text-primary block mb-1">
                  Provenance Tag
                </label>
                <input
                  type="text"
                  value={editingProduct.provenance || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, provenance: e.target.value })}
                  className="w-full bg-surface-container-low border border-surface-variant px-3 py-2 text-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 border border-surface-variant py-2.5 uppercase font-bold text-primary hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2.5 uppercase font-bold tracking-widest hover:bg-secondary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
