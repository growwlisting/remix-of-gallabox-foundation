
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  trigger_label text NOT NULL DEFAULT 'Manual',
  metric_label text NOT NULL DEFAULT 'runs',
  steps integer NOT NULL DEFAULT 1,
  template_key text,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows read own workspace" ON public.workflows FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace_id());
CREATE POLICY "workflows insert own workspace" ON public.workflows FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());
CREATE POLICY "workflows update own workspace" ON public.workflows FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());
CREATE POLICY "workflows delete own workspace" ON public.workflows FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default workflows for every existing workspace
INSERT INTO public.workflows (workspace_id, name, status, trigger_label, metric_label, steps, template_key)
SELECT w.id, v.name, 'active', v.trigger_label, v.metric_label, v.steps, v.template_key
FROM public.workspaces w
CROSS JOIN (VALUES
  ('Lead Enrichment Pipeline', 'New lead added', 'leads processed', 4, 'lead_enrichment'),
  ('Stalled Deal Re-engagement', 'No activity 14 days', 'deals triggered', 6, 'reengagement'),
  ('ICP Signal Monitor', 'Daily at 9am', 'companies monitored', 3, 'icp_signal')
) AS v(name, trigger_label, metric_label, steps, template_key)
WHERE NOT EXISTS (
  SELECT 1 FROM public.workflows wf WHERE wf.workspace_id = w.id AND wf.name = v.name
);
