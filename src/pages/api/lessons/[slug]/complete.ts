import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../../lib/db';
import { exercise, exerciseAttempt, lessonProgress } from '../../../../lib/schema';
import { errorJson, json, requireUser } from '../../../../lib/api';

export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (!user) return errorJson('Inicia sesión para guardar tu progreso.', 401);

  const lessonSlug = context.params.slug;
  if (!lessonSlug) return errorJson('Lección no especificada.', 400);

  const exercises = await db
    .select()
    .from(exercise)
    .where(eq(exercise.lessonSlug, lessonSlug));

  if (exercises.length > 0) {
    const correctAttempts = await db
      .select({ exerciseId: exerciseAttempt.exerciseId })
      .from(exerciseAttempt)
      .where(
        and(
          eq(exerciseAttempt.userId, user.id),
          eq(exerciseAttempt.correct, true),
        ),
      );
    const solvedIds = new Set(correctAttempts.map((row) => row.exerciseId));
    const allSolved = exercises.every((item) => solvedIds.has(item.id));

    if (!allSolved) {
      return errorJson('Resuelve todos los ejercicios de la lección para completarla.', 403);
    }
  }

  const now = new Date();
  const existing = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, user.id),
        eq(lessonProgress.lessonSlug, lessonSlug),
      ),
    );

  if (existing.length > 0) {
    await db
      .update(lessonProgress)
      .set({ completed: true, completedAt: now, updatedAt: now })
      .where(eq(lessonProgress.id, existing[0].id));
  } else {
    await db.insert(lessonProgress).values({
      id: crypto.randomUUID(),
      userId: user.id,
      lessonSlug,
      completed: true,
      completedAt: now,
    });
  }

  return json({ completed: true });
};