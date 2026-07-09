import Link from "next/link";
import { categoryColor } from "../lib/categoryColors";

// Local Category type to avoid depending on external api typings
type Category = {
  id: string;
  name: string;
};

export default function CategoryRail({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
      {categories.map((cat, i) => {
        const color = categoryColor(i);
        return (
          <Link
            key={cat.id}
            href={`/products?category=${cat.id}`}
            className="category-pill shrink-0 flex flex-col items-center gap-2 w-24 text-center"
          >
            <div
              className={`w-16 h-16 rounded-full border border-line ${color.bg} ${color.text} flex items-center justify-center font-display text-xl font-semibold`}
            >
              {cat.name.charAt(0)}
            </div>
            <span className="text-xs font-medium leading-tight text-ink">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
