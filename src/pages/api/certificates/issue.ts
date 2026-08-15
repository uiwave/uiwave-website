import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { certificate, exam, examAttempt } from '../../../lib/schema';
import { errorJson, json, requireUser } from '../../../lib/api';
import { getProgress } from '../../../lib/services/progress';
import { SITE_NAME } from '../../../lib/site';

export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (!user) return errorJson('Inicia sesión para generar tu certificado.', 401);

  const progress = await getProgress(user.id);
  if (progress.total === 0 || progress.completed !== progress.total) {
    return errorJson(
      `Completa todas las lecciones (${progress.completed} de ${progress.total}) antes de generar tu certificado.`,
      403,
    );
  }

  const exams = await db.select().from(exam);
  const attempts = await db
    .select()
    .from(examAttempt)
    .where(eq(examAttempt.userId, user.id));

  if (exams.length === 0) {
    return errorJson('Aún no hay exámenes disponibles.', 403);
  }

  const passedExamIds = new Set(
    attempts.filter((attempt) => attempt.passed).map((attempt) => attempt.examId),
  );
  const allPassed = exams.every((item) => passedExamIds.has(item.id));

  if (!allPassed) {
    return errorJson('Aprueba todos los exámenes antes de generar tu certificado.', 403);
  }

  const [existing] = await db
    .select()
    .from(certificate)
    .where(eq(certificate.userId, user.id))
    .limit(1);

  if (existing) {
    return json({ certificate: existing });
  }

  const id = crypto.randomUUID();
  const issued = await db
    .insert(certificate)
    .values({
      id,
      userId: user.id,
      courseName: `Curso de SQL · ${SITE_NAME}`,
    })
    .returning();

  return json({ certificate: issued[0] });
};