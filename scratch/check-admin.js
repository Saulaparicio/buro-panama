import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAdmins() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .in('role', ['admin', 'staff']);
    
  if (error) {
    console.error('Error fetching admins:', error);
  } else {
    console.log('Admins found:', data);
  }
}

checkAdmins();
