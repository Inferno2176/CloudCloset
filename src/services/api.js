/**
 * CloudCloset Atelier API Service Client
 * Provides authenticated REST communication with the Node.js/Express backend.
 * Falls back gracefully to local state if the backend server is temporarily unreachable.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

const TOKEN_KEY = 'cloudcloset_auth_token';

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (_e) {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (_e) {
      // Ignore
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_e) {
      // Ignore
    }
  }
};

async function apiRequest(endpoint, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    ...options.headers
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `HTTP ${res.status}: Request failed`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // If server is unreachable (Failed to fetch), flag network error
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      err.isNetworkError = true;
    }
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    register: async (name, email, phone, password) => {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password })
      });
      if (data.token) tokenStorage.set(data.token);
      return data;
    },
    login: async (email, password, requestedRole = 'customer') => {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, requestedRole })
      });
      if (data.token) tokenStorage.set(data.token);
      return data;
    },
    me: async () => {
      return apiRequest('/auth/me');
    },
    logout: () => {
      tokenStorage.clear();
    }
  },

  // Products
  products: {
    getAll: async (params = {}) => {
      const searchParams = new URLSearchParams();
      if (params.gender && params.gender !== 'All') searchParams.set('gender', params.gender);
      if (params.category && params.category !== 'All') searchParams.set('category', params.category);
      if (params.search) searchParams.set('search', params.search);
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.isTrending) searchParams.set('isTrending', 'true');
      if (params.isNewArrival) searchParams.set('isNewArrival', 'true');
      if (params.isFeatured) searchParams.set('isFeatured', 'true');

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/products?${queryString}` : '/products';
      return apiRequest(endpoint);
    },
    getById: async (id) => {
      return apiRequest(`/products/${id}`);
    }
  },

  // Cart
  cart: {
    get: async () => {
      return apiRequest('/cart');
    },
    add: async (productId, size = 'M', color = null, quantity = 1) => {
      return apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, size, color, quantity })
      });
    },
    update: async (itemId, quantity) => {
      return apiRequest(`/cart/item/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      });
    },
    remove: async (itemId) => {
      return apiRequest(`/cart/item/${itemId}`, {
        method: 'DELETE'
      });
    },
    clear: async () => {
      return apiRequest('/cart/clear', {
        method: 'DELETE'
      });
    }
  },

  // Wishlist
  wishlist: {
    get: async () => {
      return apiRequest('/wishlist');
    },
    toggle: async (productId) => {
      return apiRequest('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
    }
  },

  // Orders
  orders: {
    checkout: async (orderData) => {
      return apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },
    getMyOrders: async () => {
      return apiRequest('/orders/my-orders');
    },
    getById: async (id) => {
      return apiRequest(`/orders/${id}`);
    }
  },

  // Admin
  admin: {
    getOrders: async (status = 'All') => {
      const endpoint = status !== 'All' ? `/admin/orders?status=${status}` : '/admin/orders';
      return apiRequest(endpoint);
    },
    updateOrderStatus: async (orderId, newStatus) => {
      return apiRequest(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
    },
    createProduct: async (productData) => {
      return apiRequest('/admin/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    },
    updateStock: async (productId, stockCount) => {
      return apiRequest(`/admin/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stockCount })
      });
    },
    deleteProduct: async (productId) => {
      return apiRequest(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
    },
    uploadImage: async (file, productId, imageType = 'primary') => {
      const formData = new FormData();
      formData.append('image', file);
      if (productId) formData.append('productId', productId);
      formData.append('imageType', imageType);

      return apiRequest('/admin/upload-image', {
        method: 'POST',
        body: formData
      });
    }
  }
};
