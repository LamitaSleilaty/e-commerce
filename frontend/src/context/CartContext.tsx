"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { api, CartItem } from "../lib/api";
import { useAuth } from "./AuthContext";

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const { items, subtotal } = await api.getCart(token);
      setItems(items);
      setSubtotal(subtotal);
    } catch {
      setItems([]);
      setSubtotal(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addToCart(productId: string, quantity = 1) {
    if (!token) throw new Error("Must be logged in");
    await api.addToCart(token, productId, quantity);
    await refresh();
  }

  async function updateItem(itemId: string, quantity: number) {
    if (!token) return;
    await api.updateCartItem(token, itemId, quantity);
    await refresh();
  }

  async function removeItem(itemId: string) {
    if (!token) return;
    await api.removeCartItem(token, itemId);
    await refresh();
  }

  return (
    <CartContext.Provider value={{ items, subtotal, loading, refresh, addToCart, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
