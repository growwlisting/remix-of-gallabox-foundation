
DELETE FROM public.profiles WHERE email LIKE '%@growthos.test';
DELETE FROM public.organizations;
INSERT INTO public.organizations(id, name, plan) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','Gallabox India','enterprise');
INSERT INTO public.workspaces(id, org_id, name, description, member_count) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','Gallabox India','Live test workspace',1);
