"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export default function FavoriteButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { token } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pending, setPending] = useState(false);
  const active = isFavorite(productId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!token || pending) return;
    setPending(true);
    try {
      await toggleFavorite(productId);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      title={token ? undefined : "Log in to save favorites"}
      className={`flex items-center justify-center rounded-full bg-paper/90 hover:bg-paper transition-colors disabled:opacity-50 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={active ? "#e0245e" : "none"}
        stroke={active ? "#e0245e" : "currentColor"}
        strokeWidth="1.8"
      >
        <path d="M12 21s-7.5-4.7-10-9.3C.4 8.3 2 4.5 5.7 4c2.1-.3 4.1.8 6.3 3 2.2-2.2 4.2-3.3 6.3-3 3.7.5 5.3 4.3 3.7 7.7C19.5 16.3 12 21 12 21z" />
      </svg>
    </button>
  );
}
