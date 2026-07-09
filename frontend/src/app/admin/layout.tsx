"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-20 text-sm text-ink/50">Loading...</div>;
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-sm">
        <p className="text-ink/60">
          This area is for store admins only.{" "}
          <Link href="/login" className="text-pink hover:underline">
            Log in with an admin account
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display text-4xl tracking-wide">ADMIN</h1>
        <Link href="/" className="text-sm text-ink/50 hover:text-pink">
          ← Back to store
        </Link>
      </div>

      <div className="flex gap-2 mb-8 border-b border-line">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              pathname?.startsWith(item.href) ? "border-pink text-pink" : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
