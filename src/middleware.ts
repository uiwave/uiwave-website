import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';

const protectedPaths = [
  '/dashboard',
  '/playground',
  '/exercises',
  '/exams',
  '/profile',
  '/certificates',
  '/progress',
];

export const onRequest = defineMiddleware(
  async (context, next) => {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    context.locals.user = session?.user ?? null;
    context.locals.session = session?.session ?? null;

    const { pathname } = context.url;

    if (protectedPaths.some((prefix) => pathname.startsWith(prefix)) && !session) {
      return context.redirect('/login');
    }

    return next();
  }
);