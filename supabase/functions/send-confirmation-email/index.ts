// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, memberName, reservationDate, spaceName, type } = await req.json()

        const isEvent = type === 'event'
        const title = isEvent ? '¡Registro Exitoso al Evento!' : '¡Reserva Confirmada en BURÓ!'
        const icon = isEvent ? '🎟️' : '🏢'
        const labelPrimary = isEvent ? 'Evento' : 'Espacio'
        const labelSecondary = isEvent ? 'Lugar' : 'Fecha y Hora'

        // Professional HTML template for BURÓ
        const html = `
      <div style="font-family: 'Inter', sans-serif; color: #1a1a1a; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <div style="background-color: #e1ff01; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
           <span style="font-size: 32px;">${icon}</span>
        </div>
        <h1 style="font-size: 28px; font-weight: 900; tracking: -0.05em; margin-bottom: 8px;">${title}</h1>
        <p style="color: #666; font-size: 14px; margin-bottom: 32px;">Hola <strong>${memberName}</strong>, ${isEvent ? 'te hemos anotado en la lista de invitados.' : 'tu espacio de trabajo te espera.'}</p>
        
        <div style="background-color: #f9fafb; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
          <div style="margin-bottom: 16px;">
            <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #9ca3af; letter-spacing: 0.1em; margin: 0 0 4px 0;">${labelPrimary}</p>
            <p style="font-weight: 900; font-size: 16px; margin: 0;">${spaceName}</p>
          </div>
          <div>
            <p style="text-transform: uppercase; font-size: 10px; font-weight: 900; color: #9ca3af; letter-spacing: 0.1em; margin: 0 0 4px 0;">Fecha y Detalle</p>
            <p style="font-weight: 900; font-size: 16px; margin: 0;">${reservationDate}</p>
          </div>
        </div>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          ${isEvent ? 'Si no puedes asistir, por favor avísanos para liberar tu cupo.' : 'Recuerda que si necesitas cancelar o modificar tu reserva, puedes hacerlo desde tu panel de usuario hasta 24 horas antes del evento.'}
        </p>

        <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 32px 0;">
        <p style="font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.2em; text-align: center;">BURÓ COWORKING PANAMÁ</p>
      </div>
    `

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Buró Panamá <onboarding@resend.dev>', // Change to your domain when ready
                to: [to],
                subject: subject,
                html: html,
            }),
        })

        const data = await res.json()

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
