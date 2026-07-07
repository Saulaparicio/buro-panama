import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Supabase connection for quotes...');
  const { data, error } = await supabase.from('spaces').select('*').limit(5);
  console.log("Data:", data);
  if (error) {
    console.error("Error:", error);
  }
}

test();

