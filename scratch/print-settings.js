import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function printTenantSettings() {
  const { data, error } = await supabase.from('tenants').select('settings').eq('slug', 'buro-panama').single();
  if (error) {
    console.error('Error fetching settings:', error);
  } else {
    console.log('Tenant Settings:', JSON.stringify(data.settings, null, 2));
  }
}

printTenantSettings();
