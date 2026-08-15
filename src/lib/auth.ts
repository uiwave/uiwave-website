import { betterAuth } from 'better-auth';
import { db } from './db';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';

export const auth = betterAuth({
  baseURL: import.meta.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  socialProviders: {
    github: {
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    },
  },
});