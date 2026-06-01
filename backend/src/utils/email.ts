import { Resend } from 'resend';
import { logger } from '../lib/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.warn(
      { to: opts.to, subject: opts.subject },
      '[EMAIL-DEV] RESEND_API_KEY não configurado — email não enviado',
    );
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? 'AjuLabs Shopping <onboarding@resend.dev>';

  const { error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    logger.error({ error, to: opts.to }, '[EMAIL] Falha ao enviar via Resend');
    throw new Error('Falha ao enviar email. Tente novamente mais tarde.');
  }

  logger.info({ to: opts.to, subject: opts.subject }, '[EMAIL] Enviado com sucesso');
}

export function recuperacaoSenhaHtml(nome: string, codigo: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
        <tr><td style="background:#f97316;padding:28px 32px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">AjuLabs Shopping</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 8px;font-size:15px;color:#374151">Olá, <strong>${nome}</strong>!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Recebemos uma solicitação de recuperação de senha. Use o código abaixo para redefinir sua senha:</p>
          <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:12px;color:#f97316;font-weight:700;letter-spacing:1px;text-transform:uppercase">Seu código</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#111827;letter-spacing:8px">${codigo}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#9ca3af">Válido por 15 minutos</p>
          </div>
          <p style="margin:0;font-size:12px;color:#9ca3af">Se você não solicitou a recuperação de senha, ignore este email. Sua senha permanece a mesma.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">© ${new Date().getFullYear()} AjuLabs · Aracaju, SE</p>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}
