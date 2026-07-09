"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { api, Favorite } from "../lib/api";
import { useAuth } from "./AuthContext";

type FavoritesContextValue = {
  favorites: Favorite[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    try {
      const { favorites } = await api.listFavorites(token);
      setFavorites(favorites);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function isFavorite(productId: string) {
    return favorites.some((f) => f.productId === productId);
  }

  async function toggleFavorite(productId: string) {
    if (!token) throw new Error("Must be logged in");
    if (isFavorite(productId)) {
      await api.removeFavorite(token, productId);
      setFavorites((prev) => prev.filter((f) => f.productId !== productId));
    } else {
      const { favorite } = await api.addFavorite(token, productId);
      setFavorites((prev) => [favorite, ...prev]);
    }
  }

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
