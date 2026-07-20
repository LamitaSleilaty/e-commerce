"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api, Order } from "../../lib/api";
import { useAsync } from "../../hooks/useAsync";
import { formatPrice } from "../../lib/format";

export default function OrdersPage() {
  const { token, user } = useAuth();
  const {
    data: orders,
    loading,
    error,
  } = useAsync<Order[]>(() => (token ? api.listOrders(token).then((r) => r.orders) : Promise.resolve([])), [token]);

  if (!user) {
    return <div className="max-w-2xl mx-auto px-6 py-20 text-sm text-ink/60">Log in to view orders.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl tracking-wide mb-8">ORDERS</h1>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-ink/50">No orders yet.</p>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between py-4 hover:bg-ink/5 px-2 rounded-lg">
              <div>
                <p className="text-sm font-medium">{o.orderNumber}</p>
                <p className="text-xs text-ink/50">{new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="chip">{o.status}</span>
              <p className="font-semibold">{formatPrice(o.total)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
