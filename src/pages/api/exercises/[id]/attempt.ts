import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../../lib/db';
import { exercise, exerciseAttempt } from '../../../../lib/schema';
import { errorJson, json, requireUser } from '../../../../lib/api';
import { createDatabase, executeSql, validateSqlInput } from '../../../../lib/sql/engine';
import { resultsMatch } from '../../../../lib/sql/evaluator';
import type { SqlResult } from '../../../../lib/sql/evaluator';

const bodySchema = z.object({
  sql: z.string(),
});

export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (!user) return errorJson('Inicia sesión para resolver ejercicios.', 401);

  const parsed = bodySchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return errorJson('Cuerpo de petición inválido.', 400);

  const { sql } = parsed.data;
  const validationError = validateSqlInput(sql);
  if (validationError) return errorJson(validationError, 400);

  const [item] = await db
    .select()
    .from(exercise)
    .where(eq(exercise.id, context.params.id ?? ''));

  if (!item) return errorJson('Ejercicio no encontrado.', 404);

  const database = await createDatabase();

  const execution = executeSql(database, sql);
  if (execution.error) {
    return json({ correct: false, error: execution.error, expected: null, result: null });
  }

  let result: SqlResult | null = execution.result ?? null;
  if (item.checkSql && result) {
    const check = executeSql(database, item.checkSql);
    if (check.error || !check.result) {
      return errorJson('Error interno al verificar la solución.', 500);
    }
    result = check.result;
  }

  const correct = result ? resultsMatch(result, item.expectedResult) : false;

  await db.insert(exerciseAttempt).values({
    id: crypto.randomUUID(),
    exerciseId: item.id,
    userId: user.id,
    sql,
    correct,
  });

  return json({
    correct,
    error: null,
    result,
    expected: item.expectedResult,
    explanation: item.explanation,
  });
};