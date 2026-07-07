
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykzdknkvpbnpxxychzmj.supabase.co';
const supabaseAnonKey = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────
// Email Notification Helpers (Resend via Edge Functions)
// ─────────────────────────────────────────────

const invokeEmail = async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke('send-email', { body });
    if (error) console.error('Email error:', error);
    return { data, error };
};

/** Send a quote/proposal email to a client */
export const sendQuoteEmail = async (params: {
    to: string;
    clientName: string;
    quoteId: string;
    items: { description: string; quantity: number; price: number }[];
    total: number;
    notes?: string;
    quoteUrl: string;
    tenantId: string;
}) => invokeEmail({ type: 'quote', ...params });

/** Send a reservation confirmation email */
export const sendReservationEmail = async (params: {
    to: string;
    memberName: string;
    spaceName: string;
    reservationDate: string;
    tenantId: string;
}) => invokeEmail({ type: 'reservation', ...params });

/** Send an RSVP/event confirmation email */
export const sendRsvpEmail = async (params: {
    to: string;
    memberName: string;
    eventName: string;
    eventDate: string;
    eventLocation: string;
    tenantId: string;
}) => invokeEmail({ type: 'rsvp', ...params });

/** Send a welcome email to a new member */
export const sendWelcomeEmail = async (params: {
    to: string;
    memberName: string;
    tenantId: string;
}) => invokeEmail({ type: 'welcome', ...params });

// Legacy compat — used by Events.tsx
export const sendEmailNotification = async (params: {
    to: string;
    subject: string;
    memberName: string;
    reservationDate: string;
    spaceName: string;
    eventLocation?: string; // New optional parameter
    type?: 'reservation' | 'rsvp';
    tenantId: string;
}) => {
    if (params.type === 'rsvp') {
        return sendRsvpEmail({
            to: params.to,
            memberName: params.memberName,
            eventName: params.subject.replace('Confirmación de Registro: ', ''), // Extracting title from subject as a fallback
            eventDate: params.reservationDate,
            eventLocation: params.eventLocation || params.spaceName,
            tenantId: params.tenantId,
        });
    }
    return sendReservationEmail({
        to: params.to,
        memberName: params.memberName,
        spaceName: params.spaceName,
        reservationDate: params.reservationDate,
        tenantId: params.tenantId,
    });
};
