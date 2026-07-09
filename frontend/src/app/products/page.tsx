import { api } from "../../lib/api";
import ProductCard from "../../components/ProductCard";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;

  let items: Awaited<ReturnType<typeof api.listProducts>>["items"] = [];
  let categories: Awaited<ReturnType<typeof api.listCategories>>["categories"] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.listProducts({ search: params.search, category: params.category }),
      api.listCategories(),
    ]);
    items = productsRes.items;
    categories = categoriesRes.categories;
  } catch {
    items = [];
    categories = [];
  }

  const activeCategory = categories.find((c) => c.id === params.category);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl tracking-wide">
            {activeCategory ? activeCategory.name.toUpperCase() : "ALL PRODUCTS"}
          </h1>
          {params.search && (
            <p className="text-sm text-ink/50 mt-1">Results for &ldquo;{params.search}&rdquo;</p>
          )}
        </div>
        <form className="flex gap-2" action="/products" method="get">
          {params.category && <input type="hidden" name="category" value={params.category} />}
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Search products..."
            className="border border-line rounded-anon px-4 py-2 text-sm bg-white outline-none focus:border-pink w-64"
          />
          <button type="submit" className="btn-secondary text-sm px-5 py-2">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <a
          href="/products"
          className={`chip ${!params.category ? "bg-ink text-paper" : ""}`}
        >
          All
        </a>
        {categories.map((c) => (
          <a
            key={c.id}
            href={`/products?category=${c.id}`}
            className={`chip ${params.category === c.id ? "bg-ink text-paper" : ""}`}
          >
            {c.name}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink/50">No products match this query.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
