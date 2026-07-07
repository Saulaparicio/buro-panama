import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    console.log("Buckets:", data);
    console.log("Error:", error);
}

checkBuckets();
