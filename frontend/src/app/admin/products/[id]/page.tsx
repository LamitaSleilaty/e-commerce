"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { api, Category, Product } from "../../../../lib/api";
import ProductForm from "../../../../components/admin/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listCategories(), api.getProduct(id, token)])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.categories);
        setProduct(prodRes.product);
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <p className="text-sm text-ink/50">Loading...</p>;
  if (!product) return <p className="text-sm text-ink/50">Product not found.</p>;

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-6">EDIT PRODUCT</h2>
      <ProductForm categories={categories} initial={product} productId={product.id} />
    </div>
  );
}
