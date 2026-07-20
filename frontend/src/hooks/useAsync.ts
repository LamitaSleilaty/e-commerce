"use client";

import { useCallback, useEffect, useState } from "react";


export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setLoading(true);
    setError(null);
    return fn()
      .then((result) => setData(result))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."))
      .finally(() => setLoading(false));

  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, setData, loading, error, refetch: run };
}
