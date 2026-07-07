
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function seedTenant() {
    console.log('🚀 Iniciando sincronización de Tenant...');
    
    const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', 'buro-panama')
        .maybeSingle();

    if (fetchError) {
        console.error('❌ Error al buscar tenant:', fetchError);
        return;
    }

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

        if (insertError) {
            console.error('❌ Error al insertar tenant:', insertError);
        } else {
            console.log('✅ Tenant creado con éxito ID:', newTenant.id);
        }
    } else {
        console.log('✅ Tenant existente:', tenant.id);
    }
}

seedTenant();
