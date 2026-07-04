
-- Add stage entry tracking for auto-computed days_in_stage
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Deal activity feed (separate from lead_activities which requires contact_id)
CREATE TABLE IF NOT EXISTS public.deal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  actor_type text NOT NULL CHECK (actor_type IN ('user','ai','system')),
  actor_name text,
  action text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_activities TO authenticated;
GRANT ALL ON public.deal_activities TO service_role;

ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deal_activities_workspace_read" ON public.deal_activities
  FOR SELECT TO authenticated
  USING (workspace_id = public.current_workspace_id());

CREATE POLICY "deal_activities_workspace_write" ON public.deal_activities
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE INDEX IF NOT EXISTS deal_activities_deal_idx
  ON public.deal_activities(deal_id, created_at DESC);

-- Auto-reset stage_entered_at + log activity on stage change
CREATE OR REPLACE FUNCTION public.deals_on_stage_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.stage_entered_at := now();
    INSERT INTO public.deal_activities(workspace_id, deal_id, actor_type, action, description)
      VALUES (NEW.workspace_id, NEW.id, 'user', 'deal.created',
              'Deal created in ' || NEW.stage);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_entered_at := now();
    NEW.days_in_stage := 0;
    INSERT INTO public.deal_activities(workspace_id, deal_id, actor_type, action, description, metadata)
      VALUES (NEW.workspace_id, NEW.id, 'user', 'stage.changed',
              'Stage moved from ' || OLD.stage || ' → ' || NEW.stage,
              jsonb_build_object('from', OLD.stage, 'to', NEW.stage));
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS deals_stage_trigger ON public.deals;
CREATE TRIGGER deals_stage_trigger
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_on_stage_change();

-- Live days_in_stage helper (call from client for accurate value)
CREATE OR REPLACE FUNCTION public.deal_days_in_stage(_stage_entered_at timestamptz)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, EXTRACT(DAY FROM (now() - _stage_entered_at))::int)
$$;

-- Automation: promote a hot contact into the pipeline
CREATE OR REPLACE FUNCTION public.promote_contact_to_deal(_contact_id uuid, _value numeric DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ws uuid; v_deal uuid; v_company text; v_channels text[];
BEGIN
  SELECT workspace_id, COALESCE(company, first_name || ' ' || last_name)
    INTO v_ws, v_company
    FROM public.contacts WHERE id = _contact_id;
  IF v_ws IS NULL THEN RAISE EXCEPTION 'contact not found'; END IF;
  IF v_ws <> public.current_workspace_id() THEN RAISE EXCEPTION 'forbidden'; END IF;

  v_channels := ARRAY['email']::text[];

  INSERT INTO public.deals(workspace_id, contact_id, company_name, value, stage, days_in_stage, ai_signal, channels)
    VALUES (v_ws, _contact_id, v_company, _value, 'prospecting', 0,
            'Promoted from Lead Intelligence', v_channels)
    RETURNING id INTO v_deal;
  RETURN v_deal;
END $$;
