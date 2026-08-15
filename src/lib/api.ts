import type { APIContext } from 'astro';
import type { User } from 'better-auth';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function errorJson(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function requireUser(context: APIContext): User | null {
  return context.locals.user ?? null;
}