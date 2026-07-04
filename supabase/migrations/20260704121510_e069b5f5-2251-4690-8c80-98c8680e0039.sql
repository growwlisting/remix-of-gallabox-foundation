
CREATE OR REPLACE FUNCTION public.contacts_auto_create_deal_on_hot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_exists uuid;
BEGIN
  IF NEW.stage = 'hot' AND (TG_OP = 'INSERT' OR OLD.stage IS DISTINCT FROM NEW.stage) THEN
    SELECT id INTO v_exists FROM public.deals
      WHERE contact_id = NEW.id AND stage NOT IN ('closed_won','closed_lost')
      LIMIT 1;
    IF v_exists IS NULL THEN
      INSERT INTO public.deals(
        workspace_id, contact_id, company_name, value, stage,
        days_in_stage, ai_signal, channels
      ) VALUES (
        NEW.workspace_id, NEW.id,
        COALESCE(NEW.company, NULLIF(TRIM(CONCAT(NEW.first_name,' ',NEW.last_name)),''), 'Unknown'),
        NULL, 'prospecting', 0,
        'Auto-created from hot lead (score ' || COALESCE(NEW.lead_score,0) || ')',
        ARRAY['email']::text[]
      );
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS contacts_hot_to_deal ON public.contacts;
CREATE TRIGGER contacts_hot_to_deal
  AFTER INSERT OR UPDATE OF stage ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.contacts_auto_create_deal_on_hot();

-- Register as a visible workflow preset in every workspace
INSERT INTO public.workflows (workspace_id, name, status, trigger_label, metric_label, steps, template_key)
SELECT w.id, 'Hot Lead → Create Deal', 'active',
       'Contact stage = hot', 'Deals auto-created', 2, 'hot_to_deal'
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.workflows wf
  WHERE wf.workspace_id = w.id AND wf.template_key = 'hot_to_deal'
);
