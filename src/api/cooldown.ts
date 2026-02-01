import type { NextApiRequest, NextApiResponse } from 'next';
import { canSend, nextPossibleSend } from '@/lib/cooldown';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email'});
  const allowed = canSend(email);
  res.status(200).json({
    canSend: allowed,
    next: Math.ceil(nextPossibleSend(email)/1000) // segundos para próximo envio
  });
}
