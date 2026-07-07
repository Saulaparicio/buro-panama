import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ykzdknkvpbnpxxychzmj.supabase.co', 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp');

async function check() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

check();
