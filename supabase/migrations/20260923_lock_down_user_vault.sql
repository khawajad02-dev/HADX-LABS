-- HADX LABS security hardening for the Supabase public schema.
-- Apply this migration in the Supabase SQL Editor or via the Supabase connector.
-- The application no longer writes user_vault with a caller-supplied user_id.

DO $$
BEGIN
  IF to_regclass('public.user_vault') IS NOT NULL THEN
    ALTER TABLE public.user_vault ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_vault FORCE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.user_vault FROM anon, authenticated;
  END IF;
END
$$;

-- No public policies are created intentionally. Re-enable narrowly scoped policies
-- only after Supabase Auth identity is wired to the table's user_id column.
