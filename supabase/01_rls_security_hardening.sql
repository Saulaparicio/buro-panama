-- ========================================================================================
-- SCRIPT DE REFORZAMIENTO DE SEGURIDAD (RLS & RBAC)
-- Proyecto: BURÓ Panamá Workspace
-- ========================================================================================

-- 1. Función auxiliar segura (Security Definer) para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_auth_user_role() 
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Eliminar la política genérica previa que daba acceso total, comprobando si la tabla existe
DO $$
DECLARE
    t TEXT;
    tenant_tables TEXT[] := ARRAY[
        'profiles', 'spaces', 'reservations', 'benefits', 
        'membership_tiers', 'memberships', 'payments', 
        'posts', 'events', 'guests', 'quotes'
    ];
BEGIN
    FOREACH t IN ARRAY tenant_tables
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', t);
        END IF;
    END LOOP;
END $$;

-- 3. Crear Políticas Granulares por Tabla

DO $$
BEGIN
    -- TABLA: profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "profiles_read_tenant" ON profiles;
        DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON profiles;
        DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON profiles;
        
        CREATE POLICY "profiles_read_own" ON profiles FOR SELECT USING (id = auth.uid());
        CREATE POLICY "profiles_read_tenant" ON profiles FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
        CREATE POLICY "profiles_update_self_or_admin" ON profiles FOR UPDATE USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND (id = auth.uid() OR public.get_auth_user_role() IN ('admin', 'staff')));
        CREATE POLICY "profiles_insert_self_or_admin" ON profiles FOR INSERT WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND (id = auth.uid() OR public.get_auth_user_role() IN ('admin', 'staff')));
    END IF;

    -- TABLA: spaces
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spaces') THEN
        DROP POLICY IF EXISTS "spaces_read_tenant" ON spaces;
        DROP POLICY IF EXISTS "spaces_write_admin" ON spaces;
        
        CREATE POLICY "spaces_read_tenant" ON spaces FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
        CREATE POLICY "spaces_write_admin" ON spaces FOR ALL USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND public.get_auth_user_role() IN ('admin', 'staff'));
    END IF;

    -- TABLA: reservations
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
        DROP POLICY IF EXISTS "reservations_read_tenant" ON reservations;
        DROP POLICY IF EXISTS "reservations_insert" ON reservations;
        DROP POLICY IF EXISTS "reservations_update_delete" ON reservations;
        DROP POLICY IF EXISTS "reservations_delete" ON reservations;

        CREATE POLICY "reservations_read_tenant" ON reservations FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
        CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND (member_id = auth.uid() OR public.get_auth_user_role() IN ('admin', 'staff')));
        CREATE POLICY "reservations_update_delete" ON reservations FOR UPDATE USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND (member_id = auth.uid() OR public.get_auth_user_role() IN ('admin', 'staff')));
        CREATE POLICY "reservations_delete" ON reservations FOR DELETE USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND (member_id = auth.uid() OR public.get_auth_user_role() IN ('admin', 'staff')));
    END IF;

    -- TABLA: posts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        DROP POLICY IF EXISTS "posts_read" ON posts;
        DROP POLICY IF EXISTS "posts_write" ON posts;
        DROP POLICY IF EXISTS "posts_update" ON posts;
        DROP POLICY IF EXISTS "posts_delete" ON posts;

        CREATE POLICY "posts_read" ON posts FOR SELECT USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid);
        CREATE POLICY "posts_write" ON posts FOR INSERT WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND profile_id = auth.uid());
        CREATE POLICY "posts_update" ON posts FOR UPDATE USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND profile_id = auth.uid());
        CREATE POLICY "posts_delete" ON posts FOR DELETE USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid AND (profile_id = auth.uid() OR public.get_auth_user_role() IN ('admin', 'staff')));
    END IF;
END $$;

-- 4. Tablas exclusivas de Administradores (Lectura pública, Escritura Admin)
DO $$
DECLARE
    t TEXT;
    admin_tables TEXT[] := ARRAY['membership_tiers', 'benefits', 'events', 'memberships', 'payments', 'guests', 'quotes'];
BEGIN
    FOREACH t IN ARRAY admin_tables
    LOOP
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP POLICY IF EXISTS "%I_read" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "%I_write" ON %I', t, t);
            
            EXECUTE format('CREATE POLICY "%I_read" ON %I FOR SELECT USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')::uuid)', t, t);
            EXECUTE format('CREATE POLICY "%I_write" ON %I FOR ALL USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')::uuid AND public.get_auth_user_role() IN (''admin'', ''staff''))', t, t);
        END IF;
    END LOOP;
END $$;

-- ========================================================================================
-- FIN DEL SCRIPT
-- ========================================================================================
