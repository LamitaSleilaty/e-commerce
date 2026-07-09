"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setResendStatus(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      }
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendStatus(null);
    try {
      const { message } = await api.resendVerification(email);
      setResendStatus(message);
    } catch {
      setResendStatus("Could not resend verification email.");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display text-4xl tracking-wide mb-8">LOG IN</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 mt-1 outline-none focus:border-pink"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {needsVerification && (
          <div className="text-xs">
            <button type="button" onClick={handleResend} className="text-pink hover:underline">
              Resend verification email
            </button>
            {resendStatus && <p className="text-ink/50 mt-2">{resendStatus}</p>}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-xs text-ink/50 mt-6">
        No account?{" "}
        <Link href="/register" className="text-pink hover:underline">
          Register
        </Link>
      </p>
    
    </div>
  );
}
