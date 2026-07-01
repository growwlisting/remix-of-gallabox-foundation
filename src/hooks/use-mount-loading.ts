import { useEffect, useState } from "react";

/**
 * Simulates a first-mount loading state for demo/polish purposes.
 * Returns true for `ms` milliseconds on initial mount, then false.
 */
export function useMountLoading(ms = 800): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
