"use client";

import { useEffect, useState } from "react";
import { api, Category } from "../../../../lib/api";
import ProductForm from "../../../../components/admin/ProductForm";

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listCategories()
      .then(({ categories }) => setCategories(categories))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink/50">Loading...</p>;

  if (categories.length === 0) {
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
