import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  console.log('Checking database table schemas...');
  
  // Check if we can select from a table named 'smtp_settings' or 'settings'
  const { data: smtpData, error: smtpError } = await supabase.from('smtp_settings').select('*').limit(1);
  console.log('smtp_settings table search:', { data: smtpData, error: smtpError?.message });

  const { data: globalData, error: globalError } = await supabase.from('global_settings').select('*').limit(1);
  console.log('global_settings table search:', { data: globalData, error: globalError?.message });

  const { data: systemData, error: systemError } = await supabase.from('system_settings').select('*').limit(1);
  console.log('system_settings table search:', { data: systemData, error: systemError?.message });
  
  // Check if tenants table has metadata or custom fields
  const { data: tenantData, error: tenantError } = await supabase.from('tenants').select('*').limit(1);
  console.log('tenants table sample:', { data: tenantData, error: tenantError?.message });
}

checkTables();
