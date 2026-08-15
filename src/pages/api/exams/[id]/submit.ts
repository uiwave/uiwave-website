import type { APIRoute } from 'astro';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { exam, examAttempt, examQuestion } from '../../../lib/schema';
import { errorJson, json, requireUser } from '../../../lib/api';
import { createDatabase, executeSql, validateSqlInput } from '../../../lib/sql/engine';
import { resultsMatch } from '../../../lib/sql/evaluator';
import type { SqlResult } from '../../../lib/sql/evaluator';

const bodySchema = z.object({
  answers: z.record(z.string(), z.union([z.number(), z.string()])),
});

export const POST: APIRoute = async (context) => {
  const user = requireUser(context);
  if (!user) return errorJson('Inicia sesión para hacer exámenes.', 401);

  const examId = context.params.id;
  if (!examId) return errorJson('Examen no especificado.', 400);

  const [item] = await db.select().from(exam).where(eq(exam.id, examId));
  if (!item) return errorJson('Examen no encontrado.', 404);

  const parsed = bodySchema.safeParse(await context.request.json().catch(() => null));
  if (!parsed.success) return errorJson('Cuerpo de petición inválido.', 400);

  const questions = await db
    .select()
    .from(examQuestion)
    .where(eq(examQuestion.examId, examId))
    .orderBy(asc(examQuestion.order));

  if (questions.length === 0) {
    return errorJson('El examen no tiene preguntas.', 404);
  }

  const answers = parsed.data.answers;
  const results: Array<{
    questionId: string;
    correct: boolean;
    expectedAnswer?: unknown;
    submittedAnswer?: unknown;
  }> = [];

  let correctCount = 0;

  for (const question of questions) {
    const answer = answers[question.id];
    let correct = false;

    if (question.type === 'multiple_choice') {
      correct =
        typeof answer === 'number' && answer === question.correctIndex;
      results.push({
        questionId: question.id,
        correct,
        expectedAnswer: question.options?.[question.correctIndex ?? -1] ?? null,
        submittedAnswer: question.options?.[answer as number] ?? null,
      });
    } else {
      const sql = typeof answer === 'string' ? answer : '';
      const validationError = validateSqlInput(sql);
      let result: SqlResult | null = null;
      let sqlError: string | null = null;

      if (!validationError) {
        const database = await createDatabase();
        const execution = executeSql(database, sql);
        if (execution.error) {
          sqlError = execution.error;
        } else if (question.checkSql) {
          const check = executeSql(database, question.checkSql);
          if (check.error || !check.result) {
            sqlError = check.error ?? 'Error al verificar la consulta.';
          } else {
            result = check.result;
          }
        } else {
          result = execution.result ?? null;
        }
        if (result) {
          correct = resultsMatch(result, question.expectedResult ?? { columns: [], rows: [] });
        }
      } else {
        sqlError = validationError;
      }

      results.push({
        questionId: question.id,
        correct,
        expectedAnswer: question.expectedResult ?? null,
        submittedAnswer: sqlError ? { error: sqlError, sql } : { sql },
      });
      if (correct) correctCount++;
      continue;
    }

    if (correct) correctCount++;
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= item.passScore;

  const attemptId = crypto.randomUUID();
  await db.insert(examAttempt).values({
    id: attemptId,
    examId,
    userId: user.id,
    score,
    passed,
    answers,
    results,
  });

  return json({
    attemptId,
    score,
    passed,
    passScore: item.passScore,
    total: questions.length,
    correct: correctCount,
  });
};