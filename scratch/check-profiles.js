const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Keys in profiles table:', data.length > 0 ? Object.keys(data[0]) : 'No profiles found');
    console.log('Sample profile:', data[0]);
  }
}

checkSchema();
