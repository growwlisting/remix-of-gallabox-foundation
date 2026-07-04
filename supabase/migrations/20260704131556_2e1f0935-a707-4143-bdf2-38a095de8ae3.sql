
DO $$ BEGIN
  CREATE TYPE public.knowledge_category AS ENUM (
    'Product Brief','ICP & Personas','Prompt Library','Email Templates','AI Rules'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  category public.knowledge_category NOT NULL,
  content text NOT NULL DEFAULT '',
  preview text NOT NULL DEFAULT '',
  agent_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_ws ON public.knowledge_documents(workspace_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kd_select_ws" ON public.knowledge_documents;
CREATE POLICY "kd_select_ws" ON public.knowledge_documents
  FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "kd_insert_ws" ON public.knowledge_documents;
CREATE POLICY "kd_insert_ws" ON public.knowledge_documents
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "kd_update_ws" ON public.knowledge_documents;
CREATE POLICY "kd_update_ws" ON public.knowledge_documents
  FOR UPDATE TO authenticated
  USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

DROP POLICY IF EXISTS "kd_delete_ws" ON public.knowledge_documents;
CREATE POLICY "kd_delete_ws" ON public.knowledge_documents
  FOR DELETE TO authenticated
  USING (workspace_id = public.current_workspace_id());

DROP TRIGGER IF EXISTS trg_kd_updated_at ON public.knowledge_documents;
CREATE TRIGGER trg_kd_updated_at BEFORE UPDATE ON public.knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_documents;

-- Seed each workspace with starter docs (idempotent by title)
INSERT INTO public.knowledge_documents (workspace_id, title, category, content, preview, agent_count)
SELECT w.id, s.title, s.category::public.knowledge_category, s.content, s.preview, s.agent_count
FROM public.workspaces w
CROSS JOIN (VALUES
  ('Product Brief v2.1','Product Brief',
   'Gallabox GrowthOS is an AI-native Revenue Operating System that unifies ICP creation, prospecting, outreach, campaigns, CRM and analytics for B2B sales teams. It replaces 6-8 point tools with a single, agent-first workspace where every workflow is orchestrated by AI.',
   'Gallabox GrowthOS is an AI-native Revenue Operating System that unifies ICP creation, prospecting, outreach, campaigns, CRM and analytics for B2B sales teams...',8),
  ('ICP Definition — SaaS 50-500','ICP & Personas',
   'Target B2B SaaS companies between 50-500 employees in North America and India. Primary personas: VP Sales, Head of Growth, RevOps leaders. Buying triggers: hiring SDRs, new funding round, GTM leadership change, expansion into new region.',
   'Target B2B SaaS companies between 50-500 employees in North America and India. Primary personas: VP Sales, Head of Growth, RevOps leaders...',6),
  ('Cold Email Framework','Prompt Library',
   'A four-part framework: (1) contextual opener grounded in a buying signal, (2) pain hypothesis, (3) light social proof, (4) low-friction CTA. Keep under 90 words. Never open with "I hope this finds you well".',
   'A four-part framework: (1) contextual opener grounded in a buying signal, (2) pain hypothesis, (3) light social proof, (4) low-friction CTA...',3),
  ('LinkedIn DM Rules (2-DM Max)','Prompt Library',
   'Never send more than two LinkedIn DMs to a single prospect. First DM references a public signal. Second DM offers a concrete resource. No pitch in DM one. Always end with a question.',
   'Never send more than two LinkedIn DMs to a single prospect. First DM references a public signal. Second DM offers a concrete resource...',2),
  ('Objection Handling Guide','Email Templates',
   'Responses for the eight most common objections: budget, timing, incumbent tool, low priority, no pain, wrong contact, decision by committee, evaluation freeze. Each response is a 3-line reply that acknowledges, reframes, and asks for a small next step.',
   'Responses for the eight most common objections: budget, timing, incumbent tool, low priority, no pain, wrong contact, decision by committee, evaluation freeze...',4),
  ('AI Agent Behavior Rules','AI Rules',
   'Global operating rules for every agent: personalize on a specific buying signal, keep first-touch emails under 100 words, never mention competitors by name, always cite the source of any claim, hand off to a human when confidence < 0.7.',
   'Global operating rules for every agent: personalize on a specific buying signal, keep first-touch emails under 100 words, never mention competitors by name...',15)
) AS s(title,category,content,preview,agent_count)
WHERE NOT EXISTS (
  SELECT 1 FROM public.knowledge_documents kd
  WHERE kd.workspace_id = w.id AND kd.title = s.title
);
