-- MIGRACIÓN PARA ARQUITECTURA MULTI-TENANT (SaaS)
-- Proyecto: BURÓ Panamá Workspace

-- 1. Crear tabla de Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    brand_color TEXT DEFAULT '#FDE910',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    plan_id UUID -- Referencia opcional a un plan global de SaaS
);

-- 2. Insertar el Tenant inicial (BURÓ Panamá)
-- Nota: Guarda este ID para actualizar las tablas existentes
INSERT INTO tenants (name, slug, brand_color)
VALUES ('BURÓ Panamá', 'buro-panama', '#FDE910')
ON CONFLICT (slug) DO NOTHING;

-- 3. Función para obtener el ID del tenant actual (buro-panama por defecto ahora)
CREATE OR REPLACE FUNCTION get_default_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM tenants WHERE slug = 'buro-panama' LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- 4. Añadir tenant_id a tablas existentes y habilitar RLS
DO $$
DECLARE
    t_id UUID := get_default_tenant_id();
    table_name TEXT;
    tenant_tables TEXT[] := ARRAY[
        'profiles', 'spaces', 'reservations', 'benefits', 
        'membership_tiers', 'memberships', 'payments', 
        'posts', 'community_events', 'guests', 'quotes'
    ];
BEGIN
    FOREACH table_name IN ARRAY tenant_tables
    LOOP
        -- Añadir columna si no existe
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)', table_name);
        
        -- Asignar el tenant por defecto a los registros actuales
        EXECUTE format('UPDATE %I SET tenant_id = %L WHERE tenant_id IS NULL', table_name, t_id);
        
        -- Hacer la columna NOT NULL
        EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', table_name);
        
        -- Habilitar RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
        
        -- Crear Política de Aislamiento
        -- Nota: Esta política asume que el JWT de Supabase contendrá el tenant_id en app_metadata
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', table_name);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I 
                        USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')::uuid)', table_name);
    END LOOP;
END $$;
