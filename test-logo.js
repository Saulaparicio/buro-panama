import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogo() {
    const { data, error } = await supabase.from('tenants').select('id, name, logo_url, brand_color').limit(1);
    console.log("Data:", data);
    console.log("Error:", error);
}

testLogo();
