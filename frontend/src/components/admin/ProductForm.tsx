"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api, Category, Product, ProductInput } from "../../lib/api";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function ProductForm({
  categories,
  initial,
  productId,
}: {
  categories: Category[];
  initial?: Product;
  productId?: string;
}) {
  const { token } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial ? Number(initial.price) : 0);
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [sku, setSku] = useState(initial?.sku || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || "");
  const [imageUrl, setImageUrl] = useState(initial?.images?.[0]?.url || "");
  const [specsText, setSpecsText] = useState(
    initial?.specifications ? Object.entries(initial.specifications).map(([k, v]) => `${k}: ${v}`).join("\n") : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function parseSpecs(): Record<string, string> | undefined {
    const lines = specsText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return undefined;
    const specs: Record<string, string> = {};
    for (const line of lines) {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) specs[key.trim()] = rest.join(":").trim();
    }
    return specs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);

    const payload: ProductInput = {
      name,
      slug: slugify(name),
      description,
      price: Number(price),
      stock: Number(stock),
      sku,
      categoryId,
      specifications: parseSpecs(),
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    };

    try {
      if (productId) {
        await api.updateProduct(token, productId, payload);
      } else {
        await api.createProduct(token, payload);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Description</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Stock</label>
          <input
            required
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">SKU</label>
          <input
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Category</label>
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink bg-white"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Image URL</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          Specifications (one per line, "key: value")
        </label>
        <textarea
          rows={4}
          value={specsText}
          onChange={(e) => setSpecsText(e.target.value)}
          placeholder={"fabric: 100% cotton\nfit: regular"}
          className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink font-mono text-sm"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
        {saving ? "Saving..." : productId ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
