import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuote() {
    const { data, error } = await supabase
        .from('quotes')
        .select('*, tenants(name, settings)')
        .limit(1);
    console.log("Data:", JSON.stringify(data, null, 2));
    console.log("Error:", error);
}

testQuote();
