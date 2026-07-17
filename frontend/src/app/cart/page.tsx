"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, updateItem, removeItem, loading } = useCart();
  const [error, setError] = useState<string | null>(null);

  async function handleQuantityChange(itemId: string, value: string) {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setError(null);
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update quantity");
    }
  }

  async function handleRemove(itemId: string) {
    setError(null);
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove item");
    }
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-sm">
        <p className="text-ink/60">
          Log in to view your cart. <Link href="/login" className="text-pink hover:underline">Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl tracking-wide mb-8">CART</h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-anon px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink/50">
          Your cart is empty.{" "}
          <Link href="/products" className="text-pink hover:underline">
            Browse the catalog
          </Link>
        </p>
      ) : (
        <>
          <div className="divide-y divide-line border-y border-line">
            {items.map((item) => {
              const image = item.product.images?.[0]?.url;
              return (
                <div key={item.id} className="flex items-center gap-4 py-4">
                  <div className="w-20 h-20 bg-ink/5 relative shrink-0 rounded-lg overflow-hidden">
                    {image && <Image src={image} alt={item.product.name} fill className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-pink font-semibold">${Number(item.product.price).toFixed(2)}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-16 border border-line rounded-anon px-3 py-1 text-sm outline-none focus:border-pink"
                  />
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-xs text-ink/40 hover:text-pink"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-8">
            <p className="text-sm text-ink/50">Subtotal</p>
            <p className="text-2xl font-semibold">${subtotal.toFixed(2)}</p>
          </div>

          <Link href="/checkout" className="btn-primary w-full mt-6">
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  );
}
