
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.bootstrap_new_user(_full_name text, _company text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_ws uuid;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT workspace_id INTO v_ws FROM public.profiles WHERE id = auth.uid();
  IF v_ws IS NOT NULL THEN
    RETURN v_ws;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.organizations(name, plan)
    VALUES (COALESCE(NULLIF(_company,''), 'My Company'), 'enterprise')
    RETURNING id INTO v_org;

  INSERT INTO public.workspaces(org_id, name, description, member_count)
    VALUES (v_org, COALESCE(NULLIF(_company,''), 'My Workspace'), 'Default workspace', 1)
    RETURNING id INTO v_ws;

  INSERT INTO public.profiles(id, full_name, email, company, workspace_id, role)
    VALUES (auth.uid(),
            COALESCE(NULLIF(_full_name,''), split_part(v_email,'@',1)),
            v_email,
            COALESCE(NULLIF(_company,''), 'My Company'),
            v_ws,
            'admin');

  RETURN v_ws;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_new_user(text, text) TO authenticated;
