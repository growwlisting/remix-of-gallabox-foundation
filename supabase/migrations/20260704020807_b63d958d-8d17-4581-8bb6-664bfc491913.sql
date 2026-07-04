
-- Sequences: persistable multi-channel outreach sequences
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','linkedin','whatsapp','video','call')),
  subject TEXT,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequences TO authenticated;
GRANT ALL ON public.sequences TO service_role;
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq workspace read" ON public.sequences FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace_id());
CREATE POLICY "seq workspace write" ON public.sequences FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());
CREATE POLICY "seq workspace update" ON public.sequences FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());
CREATE POLICY "seq workspace delete" ON public.sequences FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE TABLE public.sequence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  label TEXT NOT NULL,
  day_offset INT NOT NULL DEFAULT 0,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequence_steps TO authenticated;
GRANT ALL ON public.sequence_steps TO service_role;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq step read" ON public.sequence_steps FOR SELECT TO authenticated
  USING (sequence_id IN (SELECT id FROM public.sequences WHERE workspace_id = public.current_workspace_id()));
CREATE POLICY "seq step write" ON public.sequence_steps FOR INSERT TO authenticated
  WITH CHECK (sequence_id IN (SELECT id FROM public.sequences WHERE workspace_id = public.current_workspace_id()));
CREATE POLICY "seq step update" ON public.sequence_steps FOR UPDATE TO authenticated
  USING (sequence_id IN (SELECT id FROM public.sequences WHERE workspace_id = public.current_workspace_id()))
  WITH CHECK (sequence_id IN (SELECT id FROM public.sequences WHERE workspace_id = public.current_workspace_id()));
CREATE POLICY "seq step delete" ON public.sequence_steps FOR DELETE TO authenticated
  USING (sequence_id IN (SELECT id FROM public.sequences WHERE workspace_id = public.current_workspace_id()));

-- Sender identity on workspace (email name + verified email)
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS sender_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_email TEXT;
