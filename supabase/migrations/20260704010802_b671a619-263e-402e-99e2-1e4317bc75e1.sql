CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invites TO authenticated;
GRANT ALL ON public.workspace_invites TO service_role;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace members can view invites"
  ON public.workspace_invites
  FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace_id());
CREATE POLICY "workspace members can create invites"
  ON public.workspace_invites
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());
CREATE POLICY "workspace members can update invites"
  ON public.workspace_invites
  FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace_id());
CREATE POLICY "workspace members can delete invites"
  ON public.workspace_invites
  FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace_id());
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_invites;