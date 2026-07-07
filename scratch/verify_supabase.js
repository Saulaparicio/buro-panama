import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyConnection() {
  console.log('--- Supabase Connection Verification ---');
  console.log(`URL: ${supabaseUrl}`);
  
  try {
    // 1. Check basic connection / Auth reachability
    const { data: health, error: healthError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('❌ Connection established, but table "profiles" might be missing or inaccessible.');
      console.error('Error Details:', healthError.message);
    } else {
      console.log('✅ Connection established and "profiles" table is accessible.');
    }

    // 2. Check for "tenants" table (Critical for Multi-Tenant)
    const { data: tenantsData, error: tenantsError } = await supabase.from('tenants').select('*');
    
    if (tenantsError) {
      console.log('❌ Table "tenants" error or not found.');
      console.error('Error Details:', tenantsError.message);
    } else {
      console.log('✅ Table "tenants" exists. Current Data:', JSON.stringify(tenantsData));
    }

    // 3. Check for "spaces" table
    const { data: spaces, error: spacesError } = await supabase.from('spaces').select('count', { count: 'exact', head: true });
    if (spacesError) {
      console.log('❌ Table "spaces" NOT FOUND.');
    } else {
      console.log('✅ Table "spaces" exists.');
    }

  } catch (err) {
    console.error('❌ Unexpected error during verification:', err);
  }
}

verifyConnection();
