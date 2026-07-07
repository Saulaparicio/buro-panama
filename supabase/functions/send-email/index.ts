import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────
// Email Templates
// ─────────────────────────────────────────────

const baseStyles = `
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  color: #11171D;
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 40px;
  background-color: #F1F0E8;
`;

function welcomeTemplate(data: any) {
  return `
  <div style="${baseStyles}">
    <h2>¡Bienvenido a BURÓ Panamá!</h2>
    <p>Hola ${data.memberName},</p>
    <p>Esta es una prueba del servidor SMTP configurado en el panel de administración.</p>
    <p>Si recibes esto, significa que tus credenciales SMTP funcionan correctamente.</p>
  </div>`;
}

function quoteTemplate(data: any) {
  const itemsHtml = (data.items || []).map((item: any) => `
    <tr>
      <td style="padding: 12px 12px 12px 0; border-bottom: 1px solid #E5E7EB; color: #11171D;">
        <strong style="display: block; font-size: 14px;">${item.description}</strong>
        <span style="font-size: 12px; color: #6B7280;">Servicio Premium</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: center; color: #4B5563;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #4B5563;">$${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #11171D;">$${(item.quantity * item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  const subtotal = data.total;
  const tax = subtotal * 0.07;
  const finalTotal = subtotal + tax;

  return `
  <div style="${baseStyles} background-color: #F8FAFC;">
    <div style="background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 600px; margin: 0 auto; font-family: 'Inter', Arial, sans-serif;">
      
      <!-- Header -->
      <div style="background-color: #13202E; padding: 40px; text-align: center; color: ${data.tenant?.brand_color || '#FDE910'};">
        ${data.tenant?.logo_url ? 
          `<img src="${data.tenant.logo_url}" alt="Logo" style="max-height: 48px; margin: 0 auto 20px; display: inline-block;" />` : 
          `<div style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.1); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; line-height: 48px; color: #FFFFFF;">B</div>`
        }
        <p style="font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">${data.tenant?.name || 'BURÓ Panamá'}</p>
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Propuesta Comercial</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px;">
        <p style="font-size: 16px; color: #4B5563; margin-bottom: 24px; line-height: 1.6;">Hola <strong style="color: #11171D;">${data.clientName}</strong>,</p>
        
        <p style="font-size: 16px; color: #4B5563; margin-bottom: 32px; line-height: 1.6;">Adjunto encontrarás nuestra propuesta detallada para los servicios solicitados en BURÓ Panamá.</p>

        <!-- Terms / Notes -->
        ${data.notes ? `
        <div style="background-color: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 32px; border-left: 4px solid #4F46E5;">
          <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.6;"><strong>Descripción:</strong> ${data.notes}</p>
        </div>` : ''}

        <!-- Services Summary -->
        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; border-bottom: 1px solid #E5E7EB; padding-bottom: 12px; margin-bottom: 16px;">Resumen de Servicios</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr>
              <th style="padding: 12px 12px 12px 0; text-align: left; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB; text-transform: uppercase;">Servicio</th>
              <th style="padding: 12px; text-align: center; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB; text-transform: uppercase;">Cant.</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB; text-transform: uppercase;">Unit.</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; color: #6B7280; border-bottom: 1px solid #E5E7EB; text-transform: uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="background-color: #F9FAFB; padding: 24px; border-radius: 12px; margin-bottom: 40px; text-align: right;">
          <div style="margin-bottom: 12px; font-size: 14px; color: #4B5563;">
            <span style="display: inline-block; width: 120px;">Subtotal:</span>
            <span style="display: inline-block; width: 100px;">$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="margin-bottom: 16px; font-size: 14px; color: #4B5563;">
            <span style="display: inline-block; width: 120px;">ITBMS (7%):</span>
            <span style="display: inline-block; width: 100px;">$${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 18px; font-weight: bold; color: #4F46E5;">
            <span style="display: inline-block; width: 120px;">Total Mensual:</span>
            <span style="display: inline-block; width: 100px;">$${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center;">
          <p style="font-size: 14px; color: #6B7280; margin-bottom: 24px;">Para revisar los términos y aceptar formalmente la propuesta, haz clic en el siguiente botón:</p>
          <a href="${data.quoteUrl}" style="display: inline-block; background-color: #13202E; color: ${data.tenant?.brand_color || '#FDE910'}; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            REVISAR Y ACEPTAR
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #F9FAFB; border-top: 1px solid #F3F4F6; padding: 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9CA3AF;">© 2026 ${data.tenant?.name || 'BURÓ Panamá'}. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>`;
}

function reservationTemplate(data: any) {
  return `
  <div style="${baseStyles}">
    <h2 style="font-size: 24px; margin-bottom: 16px;">Confirmación de Reserva</h2>
    <p style="font-size: 16px; margin-bottom: 24px;">Hola <strong>${data.memberName}</strong>,</p>
    <p style="font-size: 16px; margin-bottom: 16px;">Tu reserva ha sido confirmada para:</p>
    <div style="background-color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
      <p style="margin: 0 0 12px 0;"><strong>Espacio:</strong> ${data.spaceName}</p>
      <p style="margin: 0;"><strong>Fecha y Hora:</strong> ${new Date(data.reservationDate).toLocaleString()}</p>
    </div>
    <p style="font-size: 16px;">¡Te esperamos en BURÓ Panamá!</p>
  </div>`;
}

function rsvpTemplate(data: any) {
  return `
  <div style="${baseStyles}">
    <h2 style="font-size: 24px; margin-bottom: 16px;">Confirmación de RSVP</h2>
    <p style="font-size: 16px; margin-bottom: 24px;">Hola <strong>${data.memberName}</strong>,</p>
    <p style="font-size: 16px; margin-bottom: 16px;">Tu asistencia ha sido confirmada para el siguiente evento:</p>
    <div style="background-color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
      <p style="margin: 0 0 12px 0;"><strong>Evento:</strong> ${data.eventName}</p>
      <p style="margin: 0 0 12px 0;"><strong>Fecha:</strong> ${new Date(data.eventDate).toLocaleString()}</p>
      <p style="margin: 0;"><strong>Ubicación:</strong> ${data.eventLocation}</p>
    </div>
    <p style="font-size: 16px;">¡Nos vemos en el evento!</p>
  </div>`;
}

// ─────────────────────────────────────────────
// Main Request Handler
// ─────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, to, subject, tenantId, ...data } = body;

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // Create client with the user's authorization header to honor RLS
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } }
    });

    // 2. Fetch Tenant Settings for SMTP
    let smtpConfig = null;
    let tenantData = null;
    
    // For testing from the settings panel, they might pass credentials directly or tenantId
    if (body.smtp) {
        smtpConfig = body.smtp;
    } else if (tenantId) {
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('name, settings')
            .eq('id', tenantId)
            .single();
            
        if (error) throw new Error("Error fetching tenant settings: " + error.message);
        smtpConfig = tenant?.settings?.smtp;
        tenantData = {
          name: tenant.name,
          logo_url: tenant.settings?.logo_url,
          brand_color: tenant.settings?.brand_color
        };
    }
    
    // Inject tenant data into template data
    data.tenant = tenantData;

    if (!smtpConfig || !smtpConfig.host) {
        throw new Error("No se encontraron credenciales SMTP para enviar el correo.");
    }

    // 3. Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port || 587,
      secure: smtpConfig.port === 465, 
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    // 4. Prepare Email Content
    let html = "";
    let emailSubject = subject || "";

    if (type === "welcome") {
      html = welcomeTemplate(data);
      emailSubject = "Verificación de SMTP - BURÓ Panamá";
    } else if (type === "quote") {
      html = quoteTemplate(data);
      emailSubject = subject || `Propuesta de Servicios - BURÓ Panamá`;
    } else if (type === "reservation") {
      html = reservationTemplate(data);
      emailSubject = subject || `Confirmación de Reserva - BURÓ Panamá`;
    } else if (type === "rsvp") {
      html = rsvpTemplate(data);
      emailSubject = subject || `Confirmación de Asistencia - BURÓ Panamá`;
    } else {
        html = `<p>Test Email</p>`;
        emailSubject = "Test Email";
    }

    // 5. Send Email
    const info = await transporter.sendMail({
      from: `"${smtpConfig.sender_name || 'BURÓ'}" <${smtpConfig.sender_email}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject: emailSubject,
      html: html,
    });

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error sending email:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
