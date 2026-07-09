"use client";

import { useState } from "react";
import { api, Review } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`text-lg leading-none ${onChange ? "cursor-pointer" : "cursor-default"} ${
            n <= value ? "text-pink" : "text-ink/20"
          }`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({
  productId,
  reviews,
  onChange,
}: {
  productId: string;
  reviews: Review[];
  onChange: () => void;
}) {
  const { user, token } = useAuth();
  const myReview = user ? reviews.find((r) => r.userId === user.id) : undefined;
  const otherReviews = reviews.filter((r) => r.id !== myReview?.id);

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [comment, setComment] = useState(myReview?.comment ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  function startEditing() {
    setRating(myReview?.rating ?? 5);
    setComment(myReview?.comment ?? "");
    setStatus(null);
    setEditing(true);
  }

  async function handleSubmit() {
    if (!token) return;
    setPending(true);
    setStatus(null);
    try {
      if (myReview) {
        await api.updateReview(token, myReview.id, { rating, comment });
      } else {
        await api.createReview(token, productId, { rating, comment });
      }
      setEditing(false);
      onChange();
    } catch {
      setStatus("Could not save your review.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!token || !myReview) return;
    setPending(true);
    try {
      await api.deleteReview(token, myReview.id);
      setEditing(false);
      onChange();
    } catch {
      setStatus("Could not delete your review.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-16">
      <div className="flex items-center gap-3 section-title border-b-0 mb-4">
        <span>Reviews</span>
        {average && <span className="text-sm font-normal text-ink/60">{average} / 5 ({reviews.length})</span>}
      </div>

      {!token && <p className="text-sm text-ink/50 mb-6">Log in to leave a review.</p>}

      {token && !editing && (
        <div className="mb-8 border border-line rounded-anon p-4">
          {myReview ? (
            <>
              <div className="flex items-center justify-between">
                <Stars value={myReview.rating} />
                <div className="flex gap-3 text-xs">
                  <button onClick={startEditing} className="underline hover:text-pink">
                    Edit
                  </button>
                  <button onClick={handleDelete} disabled={pending} className="underline hover:text-pink">
                    Delete
                  </button>
                </div>
              </div>
              {myReview.comment && <p className="text-sm text-ink/70 mt-2">{myReview.comment}</p>}
            </>
          ) : (
            <button onClick={startEditing} className="btn-secondary text-sm px-5 py-2">
              Write a review
            </button>
          )}
        </div>
      )}

      {token && editing && (
        <div className="mb-8 border border-line rounded-anon p-4 space-y-3">
          <Stars value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on this product..."
            rows={3}
            className="w-full border border-line rounded-anon px-3 py-2 text-sm outline-none focus:border-pink"
          />
          <div className="flex items-center gap-3">
            <button onClick={handleSubmit} disabled={pending} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
              {myReview ? "Save" : "Submit"}
            </button>
            <button onClick={() => setEditing(false)} className="text-sm text-ink/50 hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      {status && <p className="text-sm text-pink mb-4">{status}</p>}

      {otherReviews.length === 0 && !myReview ? (
        <p className="text-sm text-ink/50">No reviews yet — be the first to leave one.</p>
      ) : (
        <ul className="space-y-5">
          {otherReviews.map((r) => (
            <li key={r.id} className="border-b border-line pb-4">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="text-xs text-ink/40">
                  {r.user ? `${r.user.firstName} ${r.user.lastName}` : "Anonymous"}
                </span>
              </div>
              {r.comment && <p className="text-sm text-ink/70 mt-1.5">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
