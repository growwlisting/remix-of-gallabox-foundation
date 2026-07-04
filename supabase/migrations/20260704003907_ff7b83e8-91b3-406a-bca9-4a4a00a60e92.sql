
CREATE OR REPLACE FUNCTION public.bootstrap_new_user(_full_name text, _company text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Prefer an existing "Gallabox India" workspace (live test tenant)
  SELECT w.id, w.org_id INTO v_ws, v_org
    FROM public.workspaces w
    WHERE w.name = 'Gallabox India'
    LIMIT 1;

  IF v_ws IS NULL THEN
    INSERT INTO public.organizations(name, plan)
      VALUES (COALESCE(NULLIF(_company,''), 'My Company'), 'enterprise')
      RETURNING id INTO v_org;
    INSERT INTO public.workspaces(org_id, name, description, member_count)
      VALUES (v_org, COALESCE(NULLIF(_company,''), 'My Workspace'), 'Default workspace', 1)
      RETURNING id INTO v_ws;
  ELSE
    UPDATE public.workspaces SET member_count = COALESCE(member_count,0) + 1 WHERE id = v_ws;
  END IF;

  INSERT INTO public.profiles(id, full_name, email, company, workspace_id, role)
    VALUES (auth.uid(),
            COALESCE(NULLIF(_full_name,''), split_part(v_email,'@',1)),
            v_email,
            COALESCE(NULLIF(_company,''), 'Gallabox India'),
            v_ws,
            'admin');

  RETURN v_ws;
END;
$function$;
