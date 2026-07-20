"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api, Product } from "../../../lib/api";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useAsync } from "../../../hooks/useAsync";
import { formatPrice } from "../../../lib/format";
import FavoriteButton from "../../../components/FavoriteButton";
import ReviewSection from "../../../components/ReviewSection";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<string | null>(null);

  const {
    data: product,
    loading,
    error,
    refetch,
  } = useAsync<Product>(() => api.getProduct(id, token).then((r) => r.product), [id, token]);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-16 text-sm text-ink/50">Loading product...</div>;
  }

  if (error) {
    return <div className="max-w-6xl mx-auto px-6 py-16 text-sm text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="max-w-6xl mx-auto px-6 py-16 text-sm text-ink/50">Product not found.</div>;
  }

  const specs = product.specifications ? Object.entries(product.specifications) : [];
  const image = product.images?.[0]?.url;

  async function handleAdd() {
    if (!token) {
      setStatus("Log in to add items to your cart.");
      return;
    }
    if (!product) return;
    try {
      await addToCart(product.id, quantity);
      setStatus("Added to cart!");
    } catch {
      setStatus("Could not add to cart.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-[3/4] bg-ink/5 relative overflow-hidden rounded-lg">
          {image ? (
            <Image src={image} alt={product.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-ink/30">No image</div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            {product.category?.name && <span className="tag-new">{product.category.name}</span>}
            <FavoriteButton productId={product.id} className="w-9 h-9 border border-line" />
          </div>
          <h1 className="font-display text-4xl tracking-wide mt-3">{product.name}</h1>
          <p className="text-2xl font-semibold mt-3">{formatPrice(product.price)}</p>
          <p className="text-ink/70 mt-4">{product.description}</p>

          {specs.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {specs.map(([key, val]) => (
                <span key={key} className="chip">
                  {key}: {String(val)}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            <input
              type="number"
              min={1}
              max={product.stock}
              aria-label={`Quantity for ${product.name}`}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20 border border-line rounded-anon px-4 py-2 text-sm outline-none focus:border-pink"
            />
            <button onClick={handleAdd} disabled={product.stock === 0} className="btn-primary disabled:opacity-40">
              {product.stock === 0 ? "Out of stock" : "Add to cart"}
            </button>
          </div>
          {status && <p className="text-sm text-ink/60 mt-3">{status}</p>}
        </div>
      </div>

      <ReviewSection productId={product.id} reviews={product.reviews ?? []} onChange={refetch} />
    </div>
  );
}
