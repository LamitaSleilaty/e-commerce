const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export type Category = {
  id: string;
  name: string;
  description: string | null;
  _count?: { products: number };
};

export type Address = {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
};

export type Review = {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string };
};

export type Favorite = {
  id: string;
  productId: string;
  createdAt: string;
  product?: Product;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  aiDescription: string | null;
  price: number;
  stock: number;
  sku: string;
  specifications: Record<string, string> | null;
  categoryId: string;
  category?: { id: string; name: string };
  images: { id: string; url: string; altText: string | null }[];
  reviews?: Review[];
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: Product;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  user?: { id: string; email: string; firstName: string; lastName: string };
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "CUSTOMER" | "ADMIN";
  emailVerified?: boolean;
};

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  categoryId: string;
  specifications?: Record<string, string>;
  images?: { url: string; altText?: string }[];
};

function mapProduct(p: any): Product {
  return { ...p, price: Number(p.price) };
}

function mapOrderItem(oi: any): OrderItem {
  return { ...oi, unitPrice: Number(oi.unitPrice), product: mapProduct(oi.product) };
}

function mapOrder(o: any): Order {
  return {
    ...o,
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    shippingFee: Number(o.shippingFee),
    total: Number(o.total),
    items: (o.items || []).map(mapOrderItem),
  };
}

function mapCartItem(ci: any): CartItem {

  return { ...ci, product: ci.product ? mapProduct(ci.product) : ci.product };
}

function mapFavorite(f: any): Favorite {
  return { ...f, product: f.product ? mapProduct(f.product) : f.product };
}

class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body?.code);
  }
  return body as T;
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    request<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  verifyEmail: (token: string) =>
    request<{ token: string; user: User }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string) =>
    request<{ message: string }>("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: (token: string) => request<{ user: User }>("/auth/me", {}, token),

  // Categories
  listCategories: () => request<{ categories: Category[] }>("/categories"),
  createCategory: (token: string, data: { name: string; description?: string }) =>
    request<{ category: Category }>("/categories", { method: "POST", body: JSON.stringify(data) }, token),

  // Products
  listProducts: async (params?: { search?: string; category?: string; limit?: number }) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "")
    ) as Record<string, string>;
    const qs = new URLSearchParams(clean).toString();
    const { items, total } = await request<{ items: any[]; total: number }>(`/products${qs ? `?${qs}` : ""}`);
    return { items: items.map(mapProduct), total };
  },
  getProduct: async (id: string, token?: string | null) => {
    const { product } = await request<{ product: any }>(`/products/${id}`, {}, token);
    return { product: mapProduct(product) };
  },
  createProduct: async (token: string, data: ProductInput) => {
    const { product } = await request<{ product: any }>("/products", { method: "POST", body: JSON.stringify(data) }, token);
    return { product: mapProduct(product) };
  },
  updateProduct: async (token: string, id: string, data: Partial<ProductInput>) => {
    const { product } = await request<{ product: any }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }, token);
    return { product: mapProduct(product) };
  },
  deleteProduct: (token: string, id: string) => request<void>(`/products/${id}`, { method: "DELETE" }, token),

  // Cart
  getCart: async (token: string) => {
    const { items, subtotal } = await request<{ items: any[]; subtotal: number }>("/cart", {}, token);
    return { items: items.map(mapCartItem), subtotal };
  },
  addToCart: async (token: string, productId: string, quantity = 1) => {
    const { item } = await request<{ item: any }>("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }, token);
    return { item: mapCartItem(item) };
  },
  updateCartItem: async (token: string, itemId: string, quantity: number) => {
    const { item } = await request<{ item: any }>(`/cart/items/${itemId}`, { method: "PUT", body: JSON.stringify({ quantity }) }, token);
    return { item: mapCartItem(item) };
  },
  removeCartItem: (token: string, itemId: string) =>
    request<void>(`/cart/items/${itemId}`, { method: "DELETE" }, token),

  // Addresses
  listAddresses: (token: string) => request<{ addresses: Address[] }>("/addresses", {}, token),
  createAddress: (token: string, data: Omit<Address, "id" | "isDefault"> & { isDefault?: boolean }) =>
    request<{ address: Address }>("/addresses", { method: "POST", body: JSON.stringify(data) }, token),

  // Orders
  checkout: async (token: string, addressId: string, paymentMethod = "card") => {
    const { order } = await request<{ order: any }>("/orders/checkout", { method: "POST", body: JSON.stringify({ addressId, paymentMethod }) }, token);
    return { order: mapOrder(order) };
  },
  listOrders: async (token: string) => {
    const { orders } = await request<{ orders: any[] }>("/orders", {}, token);
    return { orders: orders.map(mapOrder) };
  },
  listAllOrders: async (token: string) => {
    const { orders } = await request<{ orders: any[] }>("/orders/admin/all", {}, token);
    return { orders: orders.map(mapOrder) };
  },
  getOrder: async (token: string, id: string) => {
    const { order } = await request<{ order: any }>(`/orders/${id}`, {}, token);
    return { order: mapOrder(order) };
  },
  updateOrderStatus: async (token: string, id: string, status: string) => {
    const { order } = await request<{ order: any }>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
    return { order: mapOrder(order) };
  },

  // Reviews
  createReview: (token: string, productId: string, data: { rating: number; comment?: string }) =>
    request<{ review: Review }>(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(data) }, token),
  updateReview: (token: string, id: string, data: { rating?: number; comment?: string }) =>
    request<{ review: Review }>(`/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteReview: (token: string, id: string) => request<void>(`/reviews/${id}`, { method: "DELETE" }, token),

  // Favorites
  listFavorites: async (token: string) => {
    const { favorites } = await request<{ favorites: any[] }>("/favorites", {}, token);
    return { favorites: favorites.map(mapFavorite) };
  },
  addFavorite: async (token: string, productId: string) => {
    const { favorite } = await request<{ favorite: any }>("/favorites", { method: "POST", body: JSON.stringify({ productId }) }, token);
    return { favorite: mapFavorite(favorite) };
  },
  removeFavorite: (token: string, productId: string) =>
    request<void>(`/favorites/${productId}`, { method: "DELETE" }, token),

  // AI Assistant
  chat: (token: string, message: string, conversationId?: string) =>
    request<{ conversationId: string; reply: string }>(
      "/ai/chat",
      { method: "POST", body: JSON.stringify({ message, conversationId }) },
      token
    ),
  recommendations: (token: string) => request<{ items: Product[] }>("/ai/recommendations", {}, token),
};

export { ApiError };
