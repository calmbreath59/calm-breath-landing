// Simple memory cooldown per email (should be replaced by Redis or DB in prod)
const lastSent: Record<string, number> = {};
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

export function canSend(email: string) {
  const now = Date.now();
  if (!lastSent[email] || now - lastSent[email] > COOLDOWN_MS) {
    lastSent[email] = now;
    return true;
  }
  return false;
}

export function nextPossibleSend(email: string) {
  if (!lastSent[email]) return 0;
  return lastSent[email] + COOLDOWN_MS - Date.now();
}
