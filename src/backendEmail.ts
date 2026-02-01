import nodemailer from "nodemailer";

// Config SMTP
const smtpUser = process.env.SMTP_USER!;
const smtpPass = process.env.SMTP_PASS!;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendAppEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
  return info;
}
// Para chamadas HTTP (por ex: Edge Function Supabase -> Vercel/Express
// POST /api/email  { to, subject, html }
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: "Missing params" });
  try {
    await sendAppEmail({ to, subject, html });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
