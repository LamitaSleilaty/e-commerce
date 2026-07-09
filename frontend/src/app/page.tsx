import Link from "next/link";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import CategoryRail from "../components/CategoryRail";

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof api.listProducts>>["items"] = [];
  let categories: Awaited<ReturnType<typeof api.listCategories>>["categories"] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([api.listProducts(), api.listCategories()]);
    items = productsRes.items;
    categories = categoriesRes.categories;
  } catch {
    items = [];
    categories = [];
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-cultured border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="tag-sale">New season</span>
            <h1 className="font-display text-5xl md:text-6xl font-semibold leading-tight tracking-wide mt-4 text-ink">
              Everything,
              <br />
              everyday.
            </h1>
            <p className="text-ink/60 mt-6 max-w-md">
              Fashion, beauty, home, and tech — all in one place, with an AI stylist
              on call whenever you need a second opinion.
            </p>
            <div className="flex gap-4 mt-8">
              <Link href="/products" className="btn-primary">
                Shop now
              </Link>
              <Link href="/register" className="btn-secondary">
                Join TALAMITA
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.slice(0, 4).map((p) => {
              const image = p.images?.[0]?.url;
              return (
                <div key={p.id} className="aspect-square rounded-anon overflow-hidden bg-paper border border-line relative">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={p.name} className="w-full h-full object-cover" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <CategoryRail categories={categories} />
      </section>

      {/* Trending products */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-6 border-b border-line pb-3">
          <h2 className="font-display text-xl font-semibold tracking-wide text-ink capitalize">Trending now</h2>
          <Link href="/products" className="text-sm font-medium text-pink hover:underline">
            View all →
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-ink/50">No products found — check the backend is running and seeded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
