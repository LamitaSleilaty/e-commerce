"use client";

import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { api, Order } from "../../../lib/api";
import { useAsync } from "../../../hooks/useAsync";
import { formatPrice } from "../../../lib/format";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { data: order, loading, error } = useAsync<Order | null>(
    () => (token ? api.getOrder(token, id).then((r) => r.order) : new Promise(() => {})),
    [token, id]
  );

  if (error) {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-sm text-red-600">{error}</div>;
  }

  if (loading || !order) {
    return <div className="max-w-3xl mx-auto px-6 py-20 text-sm text-ink/50">Loading order...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <span className="tag-new">Order confirmed</span>
      <h1 className="font-display text-4xl tracking-wide mt-3 mb-1">{order.orderNumber}</h1>
      <p className="text-xs text-ink/50 mb-8">
        {new Date(order.createdAt).toLocaleString()} · <span className="chip">{order.status}</span>
      </p>

      <div className="divide-y divide-line border-y border-line">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-3">
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-1 text-sm">
        <div className="flex justify-between text-ink/60">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink/60">
          <span>Tax</span>
          <span>{formatPrice(order.tax)}</span>
        </div>
        <div className="flex justify-between text-ink/60">
          <span>Shipping</span>
          <span>{formatPrice(order.shippingFee)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-pink pt-2 border-t border-line mt-2">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
