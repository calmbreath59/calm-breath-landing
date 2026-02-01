import type { NextApiRequest, NextApiResponse } from 'next';
import sendAppEmail from '../backendEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  const { email, reason } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email'});
  try {
    await sendAppEmail({
      to: email,
      subject: 'Account Ban - Calm Breath',
      html: `<h2>Your account was banned</h2><p>Reason: ${reason || 'No explanation provided'}.</p><p>If you believe this is a mistake, reply to this email to request review/unban.</p>`
    });
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
