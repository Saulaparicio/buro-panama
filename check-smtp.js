import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('tenants').select('settings');
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}

check();
