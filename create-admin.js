import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log('Creating admin user...');
  
  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'workspace_admin@buropanama.com',
    password: 'buro211431*',
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    return;
  }

  console.log('User created in Auth:', authData.user?.email);

  // 2. Insert into profiles with admin role
  if (authData.user) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      name: 'Workspace Admin',
      role: 'admin',
      credits: 100
    });

    if (profileError) {
      console.error('Error creating profile:', profileError.message);
    } else {
      console.log('Profile created successfully with Admin role!');
    }
  }
}

createAdmin();
