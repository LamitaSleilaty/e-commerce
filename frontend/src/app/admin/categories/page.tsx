"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, Category } from "../../../lib/api";

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api
      .listCategories()
      .then(({ categories }) => setCategories(categories))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await api.createCategory(token, { name, description: description || undefined });
      setName("");
      setDescription("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div>
        <h2 className="font-display text-2xl tracking-wide mb-6">CATEGORIES</h2>
        {loading ? (
          <p className="text-sm text-ink/50">Loading...</p>
        ) : (
          <div className="divide-y divide-line border-y border-line">
            {categories.map((c) => (
              <div key={c.id} className="flex justify-between py-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="text-xs text-ink/50">{c.description}</p>}
                </div>
                <span className="chip">{c._count?.products ?? 0} products</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wide mb-6">NEW CATEGORY</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
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
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Saving..." : "Create category"}
          </button>
        </form>
      </div>
    </div>
  );
}
