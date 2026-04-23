import nodemailer from "nodemailer";
import { env } from "./env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (!env.SMTP_ENABLED) return null;
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransport;
}

export async function sendEmail(opts: SendEmailOptions): Promise<"sent" | "skipped"> {
  const transport = getTransport();
  if (!transport) {
    console.warn(
      `[email] SMTP not configured — skipping email to ${opts.to} (${opts.subject})`,
    );
    return "skipped";
  }
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
  });
  return "sent";
}

// ---------------------------------------------------------------------------
// Idea approved — template for the admin e-mail.
// ---------------------------------------------------------------------------

export interface IdeaApprovedEmailPayload {
  adminEmail: string;
  userName: string;
  userEmail: string;
  originalPrompt: string;
  imageUrl: string;
  summary: string;
  promptHistory: string[];
  createdAt: Date;
}

export async function sendIdeaApprovedEmail(p: IdeaApprovedEmailPayload) {
  const html = renderIdeaApprovedHtml(p);
  const text = `Nova ideia aprovada por um cliente Astra: ${p.userName} (${p.userEmail}).\nPrompt: ${p.originalPrompt}\nResumo: ${p.summary}\nImagem: ${p.imageUrl}`;
  return sendEmail({
    to: p.adminEmail,
    subject: `✨ Nova ideia de cliente Astra — ${p.userName}`,
    html,
    text,
    replyTo: p.userEmail,
  });
}

function renderIdeaApprovedHtml(p: IdeaApprovedEmailPayload): string {
  const historyHtml = p.promptHistory
    .map((q, i) => `<li><strong>#${i + 1}:</strong> ${escapeHtml(q)}</li>`)
    .join("");
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ideia Recebida — ImaginAI</title>
</head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f5f6fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(20,22,40,0.08);">
          <tr>
            <td style="background:#0b0c14;color:#ffffff;padding:24px 32px;text-align:center;font-size:22px;font-weight:700;">
              Ideia Recebida ✨
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1f2330;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 16px;">Olá, time Astra!</p>
              <p style="margin:0 0 16px;">Um cliente Astra acabou de aprovar uma ideia no ImaginAI. Abaixo está o prompt enviado e a imagem gerada com base nele:</p>
              <div style="border-left:4px solid #2E5BFF;padding:12px 16px;background:#f0f3ff;border-radius:6px;margin:16px 0;">
                <div style="font-weight:700;color:#2E5BFF;margin-bottom:4px;">Prompt enviado:</div>
                <div style="color:#1f2330;">${escapeHtml(p.originalPrompt)}</div>
              </div>
              <p style="margin:0 0 12px;"><img src="${p.imageUrl}" alt="Imagem aprovada" style="max-width:100%;border-radius:12px;display:block;" /></p>
              <div style="background:#faf5ff;border:1px solid #e9d8fd;border-radius:8px;padding:16px;margin:16px 0;">
                <div style="font-weight:700;color:#6B46C1;margin-bottom:8px;">Resumo do retrabalho:</div>
                <div style="white-space:pre-wrap;color:#1f2330;">${escapeHtml(p.summary)}</div>
              </div>
              ${
                historyHtml
                  ? `<div style="margin:16px 0;"><strong>Histórico de prompts:</strong><ol style="padding-left:20px;">${historyHtml}</ol></div>`
                  : ""
              }
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <div style="color:#4a4f63;font-size:14px;">
                <div><strong>Idealizador:</strong> ${escapeHtml(p.userName)}</div>
                <div><strong>E-mail:</strong> ${escapeHtml(p.userEmail)}</div>
                <div><strong>Data:</strong> ${p.createdAt.toLocaleString("pt-BR")}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px;color:#8a90a6;font-size:12px;text-align:center;">
              ImaginAI por Astra — e-mail enviado automaticamente.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
