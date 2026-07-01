import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type CopilotContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CopilotContext = createContext<CopilotContextValue | undefined>(undefined);
const STORAGE_KEY = "growthos-copilot-open";

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored !== null) setOpenState(stored === "1");
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }, []);

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  return <CopilotContext.Provider value={{ open, setOpen, toggle }}>{children}</CopilotContext.Provider>;
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}
