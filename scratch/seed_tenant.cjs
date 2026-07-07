
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function seedTenant() {
    console.log('🚀 Iniciando sincronización de Tenant...');
    try {
        const { data: tenant, error: fetchError } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', 'buro-panama')
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!tenant) {
            console.log('📝 Tenant no encontrado. Creando registro maestro...');
            const { data: newTenant, error: insertError } = await supabase
                .from('tenants')
                .insert([{
                    name: 'BURÓ Panamá',
                    slug: 'buro-panama',
                    settings: { theme: 'dark', primary_color: '#FDE910' }
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            console.log('✅ Tenant creado con éxito ID:', newTenant.id);
        } else {
            console.log('✅ Tenant ya existe:', tenant.id);
        }
    } catch (err) {
        console.error('❌ Error crítico:', err.message);
    }
}

seedTenant();
