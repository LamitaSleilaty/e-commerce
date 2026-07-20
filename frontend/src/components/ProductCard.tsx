import Link from "next/link";
import Image from "next/image";
import { Product } from "../lib/api";
import { formatPrice } from "../lib/format";
import FavoriteButton from "./FavoriteButton";

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.url;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block border border-line rounded-anon overflow-hidden hover:shadow-md transition-shadow bg-paper"
    >
      <div className="aspect-[3/4] bg-cultured relative overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-ink/30">No image</div>
        )}
        {product.category?.name && (
          <span className="absolute top-2 left-2 tag-new">{product.category.name}</span>
        )}
        <FavoriteButton productId={product.id} className="absolute top-2 right-2 w-8 h-8 shadow-sm" />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-paper/80 flex items-center justify-center">
            <span className="chip">Sold out</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-pink transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-semibold text-ink">{formatPrice(product.price)}</span>
        </div>
        {isLowStock && <p className="text-xs text-pink font-medium mt-1">Only {product.stock} left</p>}
      </div>
    </Link>
  );
}
