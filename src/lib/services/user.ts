import { eq } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../schema';

function deriveBaseUsername(email: string): string {
  const local = email.split('@')[0] ?? 'user';
  const cleaned = local.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
  return cleaned || 'user';
}

async function usernameTaken(username: string): Promise<boolean> {
  const found = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  return found.length > 0;
}

export async function ensureUsername(
  userId: string,
  email: string,
  name?: string,
): Promise<string | null> {
  const [found] = await db.select({ username: user.username }).from(user).where(eq(user.id, userId));
  if (found?.username) return found.username;

  const nameBase =
    (name?.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) ||
      deriveBaseUsername(email));
  let candidate = nameBase;
  let counter = 1;
  while (await usernameTaken(candidate)) {
    candidate = `${nameBase}${counter}`;
    counter++;
  }
  await db.update(user).set({ username: candidate }).where(eq(user.id, userId));
  return candidate;
}