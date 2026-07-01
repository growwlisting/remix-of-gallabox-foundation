import { useEffect, useState } from "react";
import { getRouteMeta } from "@/lib/route-meta";

const KEY = "growthos-recent-routes";
const MAX = 5;

type Listener = (routes: string[]) => void;
const listeners = new Set<Listener>();
let current: string[] = [];

function load(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  current = list;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
  listeners.forEach((l) => l(list));
}

export function trackRoute(path: string) {
  if (!path) return;
  // Only track recognized routes
  if (!getRouteMeta(path)) return;
  if (current.length === 0) current = load();
  const next = [path, ...current.filter((p) => p !== path)].slice(0, MAX);
  save(next);
}

export function useRecentRoutes(excludeCurrent?: string): string[] {
  const [routes, setRoutes] = useState<string[]>(() => (current.length ? current : load()));
  useEffect(() => {
    const l: Listener = (r) => setRoutes(r);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return excludeCurrent ? routes.filter((r) => r !== excludeCurrent) : routes;
}
