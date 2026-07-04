
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS industry TEXT;

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_name TEXT,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activities_contact_idx ON public.lead_activities(contact_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members read activities"
ON public.lead_activities FOR SELECT TO authenticated
USING (workspace_id = public.current_workspace_id());

CREATE POLICY "workspace members write activities"
ON public.lead_activities FOR INSERT TO authenticated
WITH CHECK (workspace_id = public.current_workspace_id());
