"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { api, Product } from "../../../lib/api";

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { items } = await api.listProducts({ limit: 200 });
      setProducts(items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!token) return;
    if (!confirm("Remove this product from the store?")) return;
    setError(null);
    try {
      await api.deleteProduct(token, id);
      setProducts((p) => p.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete product.");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-ink/50">{products.length} products</p>
        <Link href="/admin/products/new" className="btn-primary text-sm px-5 py-2">
          + New product
        </Link>
      </div>

      {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 py-3">
              <div className="w-14 h-14 bg-ink/5 rounded-lg overflow-hidden shrink-0">
                {p.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-ink/50">{p.category?.name} · SKU {p.sku}</p>
              </div>
              <p className="text-sm font-semibold w-20 text-right">${Number(p.price).toFixed(2)}</p>
              <p className="text-xs text-ink/50 w-24 text-right">{p.stock} in stock</p>
              <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-pink hover:underline">
                Edit
              </Link>
              <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-ink/40 hover:text-red-600">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
