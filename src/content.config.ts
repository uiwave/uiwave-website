import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number(),
    description: z.string(),
    difficulty: z.enum(['basico', 'intermedio', 'avanzado']).default('basico'),
    minutes: z.number().default(10),
  }),
});

export const collections = { lessons };