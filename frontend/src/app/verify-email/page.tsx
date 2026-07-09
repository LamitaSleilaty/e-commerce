"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

function VerifyEmailInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setError("Missing verification token.");
      return;
    }
    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => router.push("/"), 1500);
      })
      .catch((err) => {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-sm text-center">
      <h1 className="font-display text-4xl tracking-wide mb-6">VERIFY EMAIL</h1>
      {status === "pending" && <p className="text-ink/50">Verifying your email...</p>}
      {status === "success" && <p className="text-ink/70">Your email is verified! Redirecting you now...</p>}
      {status === "error" && (
        <>
          <p className="text-red-600">{error}</p>
          <p className="text-ink/50 mt-4">
            <Link href="/login" className="text-pink hover:underline">
              Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-20 text-sm text-ink/50">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
