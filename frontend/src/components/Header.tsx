"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { favorites } = useFavorites();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-paper">
      {/* Utility bar */}
      <div className="hidden sm:block bg-ink text-paper/70">
        <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between text-xs tracking-wide">
          <span>Free shipping this week on orders over $55</span>
          <span>
            AI shopping assistant
          </span>
        </div>
      </div>

      {/* Main bar: logo, search, actions */}
      <div className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-ink shrink-0">
            TALAMITA<span className="text-pink">.</span>
          </Link>

          <form action="/products" method="get" className="hidden md:flex flex-1 max-w-md">
            <input
              name="search"
              placeholder="Search for anything..."
              className="w-full border border-line rounded-anon rounded-r-none px-4 py-2 text-sm bg-paper outline-none focus:border-ink"
            />
            <button
              type="submit"
              aria-label="Search"
              className="bg-ink text-paper px-4 rounded-anon rounded-l-none hover:bg-pink transition-colors"
            >
              Go
            </button>
          </form>

          <div className="flex items-center gap-5 text-sm font-medium text-ink">
            {user ? (
              <>
               {/*{user.role === "ADMIN" && (
                  <Link href="/admin" className="hidden sm:inline hover:text-pink transition-colors">
                    Admin
                  </Link>
               )}
               {/*<Link href="/orders" className="hidden sm:inline hover:text-pink transition-colors">
                  Orders
                </Link>*/}
                <button onClick={logout} className="hover:text-pink transition-colors">
                  Hi, {user.firstName}
                </button>
              </>
            ) : (
              <Link href="/login" className="hover:text-pink transition-colors">
                Log in
              </Link>
            )}
            <Link href="/favorites" className="relative hover:text-pink transition-colors">
              Favorites
              {favorites.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-pink text-ink text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className="relative hover:text-pink transition-colors">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-pink text-ink text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category / page navigation */}
      <nav className="hidden md:block bg-paper border-b border-line">
        <div className="max-w-6xl mx-auto px-6">
          <ul className="flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-ink/80 py-3">
            <li>
              <Link href="/" className="hover:text-pink transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-pink transition-colors">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-pink transition-colors">
                My Orders
              </Link>
            </li>
            {user?.role === "ADMIN" && (
              <li>
                <Link href="/admin" className="hover:text-pink transition-colors">
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
}
