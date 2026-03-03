
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const sendEmailNotification = async (params: {
    to: string;
    subject: string;
    memberName: string;
    reservationDate: string;
    spaceName: string;
    type?: 'reservation' | 'rsvp';
}) => {
    const { data, error } = await supabase.functions.invoke('send-confirmation-email', {
        body: params
    });
    return { data, error };
};
