"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { api, Order } from "../../../lib/api";
import { useAsync } from "../../../hooks/useAsync";
import { formatPrice } from "../../../lib/format";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const {
    data: orders,
    setData: setOrders,
    loading,
    error: loadError,
  } = useAsync<Order[]>(() => (token ? api.listAllOrders(token).then((r) => r.orders) : Promise.resolve([])), [token]);

  async function handleStatusChange(orderId: string, status: string) {
    if (!token) return;
    setUpdatingId(orderId);
    setUpdateError(null);
    try {
      await api.updateOrderStatus(token, orderId, status);
      setOrders((prev) => (prev ? prev.map((o) => (o.id === orderId ? { ...o, status } : o)) : prev));
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const error = loadError || updateError;

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wide mb-6">ALL ORDERS</h2>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-sm text-ink/50">No orders yet.</p>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-4 py-3 flex-wrap">
              <div className="min-w-[10rem]">
                <p className="text-sm font-medium">{o.orderNumber}</p>
                <p className="text-xs text-ink/50">
                  {o.user?.firstName} {o.user?.lastName} · {o.user?.email}
                </p>
              </div>
              <p className="text-xs text-ink/50 w-28">{new Date(o.createdAt).toLocaleDateString()}</p>
              <p className="font-semibold w-20">{formatPrice(o.total)}</p>
              <select
                value={o.status}
                disabled={updatingId === o.id}
                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                className="border border-line rounded-lg px-2 py-1 text-xs bg-white outline-none focus:border-pink"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
