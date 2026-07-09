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
  price: string;
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
  unitPrice: string;
  product: Product;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: string;
  tax: string;
  shippingFee: string;
  total: string;
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
  listProducts: (params?: { search?: string; category?: string; limit?: number }) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== "")
    ) as Record<string, string>;
    const qs = new URLSearchParams(clean).toString();
    return request<{ items: Product[]; total: number }>(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (id: string, token?: string | null) => request<{ product: Product }>(`/products/${id}`, {}, token),
  createProduct: (token: string, data: ProductInput) =>
    request<{ product: Product }>("/products", { method: "POST", body: JSON.stringify(data) }, token),
  updateProduct: (token: string, id: string, data: Partial<ProductInput>) =>
    request<{ product: Product }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteProduct: (token: string, id: string) => request<void>(`/products/${id}`, { method: "DELETE" }, token),

  // Cart
  getCart: (token: string) => request<{ items: CartItem[]; subtotal: number }>("/cart", {}, token),
  addToCart: (token: string, productId: string, quantity = 1) =>
    request<{ item: CartItem }>("/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }, token),
  updateCartItem: (token: string, itemId: string, quantity: number) =>
    request<{ item: CartItem }>(`/cart/items/${itemId}`, { method: "PUT", body: JSON.stringify({ quantity }) }, token),
  removeCartItem: (token: string, itemId: string) =>
    request<void>(`/cart/items/${itemId}`, { method: "DELETE" }, token),

  // Addresses
  listAddresses: (token: string) => request<{ addresses: Address[] }>("/addresses", {}, token),
  createAddress: (token: string, data: Omit<Address, "id" | "isDefault"> & { isDefault?: boolean }) =>
    request<{ address: Address }>("/addresses", { method: "POST", body: JSON.stringify(data) }, token),

  // Orders
  checkout: (token: string, addressId: string, paymentMethod = "card") =>
    request<{ order: Order }>("/orders/checkout", { method: "POST", body: JSON.stringify({ addressId, paymentMethod }) }, token),
  listOrders: (token: string) => request<{ orders: Order[] }>("/orders", {}, token),
  listAllOrders: (token: string) => request<{ orders: Order[] }>("/orders/admin/all", {}, token),
  getOrder: (token: string, id: string) => request<{ order: Order }>(`/orders/${id}`, {}, token),
  updateOrderStatus: (token: string, id: string, status: string) =>
    request<{ order: Order }>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token),

  // Reviews
  createReview: (token: string, productId: string, data: { rating: number; comment?: string }) =>
    request<{ review: Review }>(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(data) }, token),
  updateReview: (token: string, id: string, data: { rating?: number; comment?: string }) =>
    request<{ review: Review }>(`/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),
  deleteReview: (token: string, id: string) => request<void>(`/reviews/${id}`, { method: "DELETE" }, token),

  // Favorites
  listFavorites: (token: string) => request<{ favorites: Favorite[] }>("/favorites", {}, token),
  addFavorite: (token: string, productId: string) =>
    request<{ favorite: Favorite }>("/favorites", { method: "POST", body: JSON.stringify({ productId }) }, token),
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
