
REVOKE EXECUTE ON FUNCTION public.current_workspace_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_workspace_id() TO service_role;
