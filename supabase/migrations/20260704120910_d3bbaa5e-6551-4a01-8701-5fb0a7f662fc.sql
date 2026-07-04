
CREATE OR REPLACE FUNCTION public.deal_days_in_stage(_stage_entered_at timestamptz)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT GREATEST(0, EXTRACT(DAY FROM (now() - _stage_entered_at))::int)
$$;
