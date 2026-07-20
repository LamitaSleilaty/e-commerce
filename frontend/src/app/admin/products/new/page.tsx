"use client";

import { api, Category } from "../../../../lib/api";
import ProductForm from "../../../../components/admin/ProductForm";
import { useAsync } from "../../../../hooks/useAsync";

export default function NewProductPage() {
  const {
    data: categories,
    loading,
    error,
  } = useAsync<Category[]>(() => api.listCategories().then((r) => r.categories), []);

  if (loading) return <p className="text-sm text-ink/50">Loading...</p>;

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!categories || categories.length === 0) {
    return (
      <p className="text-sm text-ink/50">
        Create a category first before adding products.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-6">NEW PRODUCT</h2>
      <ProductForm categories={categories} />
    </div>
  );
}
