"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import ProductCard from "../../components/ProductCard";

export default function FavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading } = useFavorites();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-sm">
        <p className="text-ink/60">
          Log in to view your favorites. <Link href="/login" className="text-pink hover:underline">Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl tracking-wide mb-8">FAVORITES</h1>

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="text-sm text-ink/50">
          You haven&apos;t saved anything yet.{" "}
          <Link href="/products" className="text-pink hover:underline">
            Browse the catalog
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {favorites
            .filter((f) => f.product)
            .map((f) => (
              <ProductCard key={f.id} product={f.product!} />
            ))}
        </div>
      )}
    </div>
  );
}
