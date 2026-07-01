import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DealRow = {
  id: string;
  company_name: string | null;
  value: number | null;
  stage: string;
  days_in_stage: number;
  ai_signal: string | null;
  channels: string[];
};

export type CampaignRow = {
  id: string;
  name: string;
  status: string;
  channels: string[];
  leads_count: number;
  sent_count: number;
  open_count: number;
  reply_count: number;
  meetings_count: number;
  created_at: string;
};

export type ContactSignal = { label: string; tone: "intent" | "hiring" | "funding" | "tech" };

export type ContactRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  linkedin_url: string | null;
  lead_score: number;
  stage: string;
  signals: ContactSignal[];
  last_activity: string | null;
};

export type AITaskRow = {
  id: string;
  agent_name: string;
  task_description: string | null;
  status: string;
  progress: number;
  result: string | null;
  created_at: string;
};

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async (): Promise<DealRow[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select("id, company_name, value, stage, days_in_stage, ai_signal, channels")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<CampaignRow[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CampaignRow[];
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async (): Promise<ContactRow[]> => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("lead_score", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        signals: Array.isArray(c.signals) ? (c.signals as ContactSignal[]) : [],
      })) as ContactRow[];
    },
  });
}

export function useAITasks() {
  return useQuery({
    queryKey: ["ai_tasks"],
    queryFn: async (): Promise<AITaskRow[]> => {
      const { data, error } = await supabase
        .from("ai_tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AITaskRow[];
    },
  });
}

/** Short relative time like "2h ago", "1d ago". */
export function relTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 14) return `${d}d ago`;
  const w = Math.floor(d / 7);
  return `${w}w ago`;
}
