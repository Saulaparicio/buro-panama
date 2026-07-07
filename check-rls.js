import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'workspace_admin@buropanama.com',
    password: 'buro211431*'
  });
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }
  
  console.log("Logged in:", authData.user.email);

  const { data: tenantData } = await supabase.from('tenants').select('*').limit(1).single();
  console.log("Tenant id:", tenantData?.id);
  
  if (!tenantData) return;

  const { data: updateData, error: updateError } = await supabase
    .from('tenants')
    .update({ settings: { ...tenantData.settings, test: '123' } })
    .eq('id', tenantData.id)
    .select();
    
  console.log("Update Data:", updateData);
  console.log("Update Error:", updateError);
}

check();
