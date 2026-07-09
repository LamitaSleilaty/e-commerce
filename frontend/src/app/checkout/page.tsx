"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { api, Address } from "../../lib/api";

export default function CheckoutPage() {
  const { token, user } = useAuth();
  const { items, subtotal, refresh } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "Home", street: "", city: "", state: "", country: "", zipCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.listAddresses(token).then(({ addresses }) => {
      setAddresses(addresses);
      if (addresses.length > 0) setSelected(addresses[0].id);
      else setShowForm(true);
    });
  }, [token]);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const { address } = await api.createAddress(token, { ...form, isDefault: addresses.length === 0 });
      setAddresses((a) => [address, ...a]);
      setSelected(address.id);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address.");
    }
  }

  async function handlePlaceOrder() {
    if (!token || !selected) return;
    setPlacing(true);
    setError(null);
    try {
      const { order } = await api.checkout(token, selected);
      await refresh();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setPlacing(false);
    }
  }

  if (!user) {
    return <div className="max-w-2xl mx-auto px-6 py-20 text-sm text-ink/60">Log in to check out.</div>;
  }

  if (items.length === 0) {
    return <div className="max-w-2xl mx-auto px-6 py-20 text-sm text-ink/60">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl tracking-wide mb-8">CHECKOUT</h1>

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-3">Shipping address</p>
        {addresses.map((a) => (
          <label key={a.id} className="flex items-start gap-3 border border-line rounded-lg p-3 mb-2 cursor-pointer hover:border-pink">
            <input type="radio" checked={selected === a.id} onChange={() => setSelected(a.id)} className="mt-1 accent-pink" />
            <span className="text-sm">
              <strong>{a.label}</strong> — {a.street}, {a.city}, {a.state} {a.zipCode}, {a.country}
            </span>
          </label>
        ))}

        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="text-xs font-semibold text-pink hover:underline mt-2">
            + Add new address
          </button>
        ) : (
          <form onSubmit={handleAddAddress} className="space-y-3 mt-4 border border-line rounded-lg p-4">
            {(["label", "street", "city", "state", "country", "zipCode"] as const).map((field) => (
              <input
                key={field}
                required
                placeholder={field[0].toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-pink"
              />
            ))}
            <button type="submit" className="btn-secondary text-sm">
              Save address
            </button>
          </form>
        )}
      </div>

      <div className="border-t border-line pt-4 flex justify-between">
        <p className="text-sm text-ink/50">Subtotal</p>
        <p className="font-semibold">${subtotal.toFixed(2)}</p>
      </div>
      <p className="text-xs text-ink/40 mt-1">+ tax and shipping calculated at order placement</p>

      {error && <p className="text-xs text-red-600 mt-4">{error}</p>}

      <button
        onClick={handlePlaceOrder}
        disabled={!selected || placing}
        className="btn-primary w-full mt-8 disabled:opacity-50"
      >
        {placing ? "Placing order..." : "Place order"}
      </button>
    </div>
  );
}
