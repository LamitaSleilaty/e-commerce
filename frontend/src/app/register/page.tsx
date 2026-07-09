"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const msg = await register(form);
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-sm">
        <h1 className="font-display text-4xl tracking-wide mb-6">CHECK YOUR EMAIL</h1>
        <p className="text-ink/70">{message}</p>
        <p className="text-ink/50 mt-6">
          Already verified?{" "}
          <Link href="/login" className="text-pink hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-4xl tracking-wide mb-8">CREATE ACCOUNT</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">First name</label>
            <input
              required
              value={form.firstName}
              onChange={update("firstName")}
              className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Last name</label>
            <input
              required
              value={form.lastName}
              onChange={update("lastName")}
              className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Password (min 8 chars)</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="text-xs text-ink/50 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-pink hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
