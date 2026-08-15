import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  exercise,
  exam,
  examQuestion,
} from '../src/lib/schema.ts';
import { createDatabase, executeSql } from '../src/lib/sql/engine.ts';
import type { SqlResult } from '../src/lib/sql/evaluator.ts';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { exercise, exam, examQuestion } });

interface SqlExerciseSeed {
  id: string;
  lessonSlug: string;
  title: string;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  seedSql: string;
  checkSql?: string;
  explanation: string;
  order: number;
}

interface SqlQuestionSeed {
  id: string;
  order: number;
  prompt: string;
  seedSql: string;
  checkSql?: string;
  explanation: string;
}

interface McQuestionSeed {
  id: string;
  order: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

async function expectedResultFor(seedSql: string, checkSql?: string): Promise<SqlResult> {
  const dbSql = await createDatabase();
  const seedExecution = executeSql(dbSql, seedSql);
  if (seedExecution.error) {
    throw new Error(`No se pudo ejecutar la mutación del seed:\n${seedSql}\n${seedExecution.error}`);
  }
  const finalSql = checkSql ?? seedSql;
  const execution = executeSql(dbSql, finalSql);
  if (execution.error || !execution.result) {
    throw new Error(`No se pudo calcular el resultado esperado para:\n${finalSql}\n${execution.error ?? ''}`);
  }
  return execution.result;
}

const exercises: SqlExerciseSeed[] = [
  {
    id: 'select-users',
    lessonSlug: 'select',
    title: 'Primera consulta SELECT',
    prompt:
      'Obtén el nombre y el correo de todos los usuarios. Las columnas deben llamarse exactamente "name" y "email".',
    difficulty: 'easy',
    seedSql: 'SELECT name, email FROM users;',
    explanation:
      'SELECT name, email FROM users; devuelve solo las columnas name y email de todas las filas de la tabla users.',
    order: 1,
  },
  {
    id: 'where-adults',
    lessonSlug: 'where',
    title: 'Filtrar con WHERE',
    prompt:
      'Obtén todos los usuarios mayores de 25 años. Usa la condición "age > 25" y devuelve todas sus columnas.',
    difficulty: 'easy',
    seedSql: 'SELECT * FROM users WHERE age > 25;',
    explanation:
      'WHERE filtra las filas antes de devolverlas. La condición age > 25 conserva solo a los usuarios mayores de 25.',
    order: 1,
  },
  {
    id: 'order-limit-expensive',
    lessonSlug: 'order-limit',
    title: 'Los 3 productos más caros',
    prompt:
      'Obtén los 3 productos más caros del catálogo mostrando el nombre y el precio. Ordena de mayor a menor precio.',
    difficulty: 'easy',
    seedSql: 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3;',
    explanation:
      'ORDER BY price DESC ordena de mayor a menor y LIMIT 3 conserva solo los primeros tres registros.',
    order: 1,
  },
  {
    id: 'group-count-products',
    lessonSlug: 'group-by',
    title: 'Contar productos por categoría',
    prompt:
      'Cuenta cuántos productos hay en cada categoría. Muestra la columna category_id y el conteo con el alias "total".',
    difficulty: 'medium',
    seedSql:
      'SELECT category_id, COUNT(*) AS total FROM products GROUP BY category_id;',
    explanation:
      'GROUP BY category_id agrupa los productos por categoría y COUNT(*) cuenta las filas de cada grupo. El alias total da nombre a la columna del conteo.',
    order: 1,
  },
  {
    id: 'join-orders',
    lessonSlug: 'joins',
    title: 'Unir pedidos con sus datos',
    prompt:
      'Obtén el nombre del usuario, el nombre del producto y la cantidad de cada pedido. Une las tablas orders, users y products.',
    difficulty: 'medium',
    seedSql:
      'SELECT u.name, p.name, o.quantity FROM orders o JOIN users u ON o.user_id = u.id JOIN products p ON o.product_id = p.id;',
    explanation:
      'Cada JOIN relaciona dos tablas mediante una condición: orders con users por user_id y orders con products por product_id.',
    order: 1,
  },
  {
    id: 'insert-user',
    lessonSlug: 'insert-update-delete',
    title: 'Insertar un usuario',
    prompt:
      'Inserta un nuevo usuario con nombre "Ana Ruiz", email "ana.ruiz@example.com", edad 26 y país "MX". Después se verificará que exista.',
    difficulty: 'medium',
    seedSql:
      "INSERT INTO users (name, email, age, country) VALUES ('Ana Ruiz', 'ana.ruiz@example.com', 26, 'MX');",
    checkSql:
      "SELECT name, email, age, country FROM users WHERE email = 'ana.ruiz@example.com';",
    explanation:
      'INSERT INTO agrega filas a una tabla. La verificación consulta el usuario recién insertado por su email único.',
    order: 1,
  },
  {
    id: 'update-stock',
    lessonSlug: 'insert-update-delete',
    title: 'Actualizar stock',
    prompt:
      'Actualiza el stock del producto "Papas fritas 150g" a 150 unidades. Después se verificará el cambio.',
    difficulty: 'medium',
    seedSql:
      "UPDATE products SET stock = 150 WHERE name = 'Papas fritas 150g';",
    checkSql:
      "SELECT name, stock FROM products WHERE name = 'Papas fritas 150g';",
    explanation:
      'UPDATE modifica filas existentes. La cláusula WHERE indica cuáles; sin ella se actualizarían todas las filas.',
    order: 2,
  },
  {
    id: 'subquery-expensive',
    lessonSlug: 'subconsultas',
    title: 'Productos sobre el promedio',
    prompt:
      'Obtén el nombre de los productos cuyo precio es mayor que el precio promedio de todos los productos.',
    difficulty: 'hard',
    seedSql:
      'SELECT name FROM products WHERE price > (SELECT AVG(price) FROM products);',
    explanation:
      'La subconsulta (SELECT AVG(price) FROM products) calcula el promedio y la consulta externa filtra los productos por encima de ese valor.',
    order: 1,
  },
];

interface ExamSeed {
  id: string;
  slug: string;
  title: string;
  description: string;
  passScore: number;
  durationMinutes: number;
  order: number;
  questions: Array<McQuestionSeed | SqlQuestionSeed>;
}

const exams: ExamSeed[] = [
  {
    id: 'exam-fundamentos',
    slug: 'fundamentos',
    title: 'Examen de Fundamentos',
    description:
      'Pon a prueba tus bases de SQL: SELECT, WHERE, ordenamiento, agrupación y más.',
    passScore: 70,
    durationMinutes: 30,
    order: 1,
    questions: [
      {
        id: 'fund-1',
        order: 1,
        prompt: '¿Qué cláusula se usa para filtrar filas en una consulta?',
        options: ['ORDER BY', 'WHERE', 'GROUP BY', 'HAVING'],
        correctIndex: 1,
        explanation: 'WHERE filtra filas antes de devolver el resultado.',
      },
      {
        id: 'fund-2',
        order: 2,
        prompt: '¿Cómo ordenas los resultados de forma descendente?',
        options: [
          'ORDER BY columna ASC',
          'ORDER BY columna DESC',
          'SORT BY columna DESC',
          'GROUP BY columna DESC',
        ],
        correctIndex: 1,
        explanation: 'DESC indica orden descendente en ORDER BY.',
      },
      {
        id: 'fund-3',
        order: 3,
        prompt: '¿Qué operador se usa para combinar varias condiciones?',
        options: ['OR', 'LIKE', 'AND', 'NOT'],
        correctIndex: 2,
        explanation:
          'AND exige que todas las condiciones se cumplan a la vez.',
      },
      {
        id: 'fund-4',
        order: 4,
        prompt: '¿Qué comando elimina una tabla completa?',
        options: ['DELETE TABLE', 'REMOVE TABLE', 'DROP TABLE', 'ERASE TABLE'],
        correctIndex: 2,
        explanation:
          'DROP TABLE elimina la tabla y sus datos. DELETE borra filas, no la tabla.',
      },
      {
        id: 'fund-5',
        order: 5,
        prompt: '¿Qué cláusula agrupa filas para usar funciones de agregación?',
        options: ['ORDER BY', 'WHERE', 'LIMIT', 'GROUP BY'],
        correctIndex: 3,
        explanation:
          'GROUP BY agrupa filas para que COUNT, SUM, AVG etc. operen por grupo.',
      },
      {
        id: 'fund-sql-1',
        order: 6,
        prompt:
          'Escribe una consulta que devuelva el nombre de los usuarios que viven en México (country = \'MX\').',
        seedSql: "SELECT name FROM users WHERE country = 'MX';",
        explanation:
          "SELECT name FROM users WHERE country = 'MX'; filtra los usuarios mexicanos.",
      },
    ],
  },
  {
    id: 'exam-avanzado',
    slug: 'avanzado',
    title: 'Examen de SQL Avanzado',
    description:
      'JOINs, agregaciones, subconsultas y más desafíos de nivel intermedio.',
    passScore: 70,
    durationMinutes: 45,
    order: 2,
    questions: [
      {
        id: 'avz-1',
        order: 1,
        prompt:
          '¿Qué tipo de JOIN devuelve solo las filas que coinciden en ambas tablas?',
        options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'],
        correctIndex: 2,
        explanation:
          'INNER JOIN conserva únicamente las filas con coincidencia en ambas tablas.',
      },
      {
        id: 'avz-2',
        order: 2,
        prompt: '¿Qué función cuenta las filas no nulas de una columna?',
        options: ['SUM(columna)', 'COUNT(columna)', 'AVG(columna)', 'MAX(columna)'],
        correctIndex: 1,
        explanation:
          'COUNT(columna) cuenta solo los valores no nulos; COUNT(*) cuenta todas las filas.',
      },
      {
        id: 'avz-3',
        order: 3,
        prompt: '¿Qué cláusula limita la cantidad de filas devueltas?',
        options: ['TOP', 'MAX', 'LIMIT', 'STOP'],
        correctIndex: 2,
        explanation: 'LIMIT n devuelve como máximo n filas.',
      },
      {
        id: 'avz-4',
        order: 4,
        prompt:
          '¿Qué restricción crea automáticamente un índice único en SQLite?',
        options: [
          'NOT NULL',
          'CHECK',
          'DEFAULT',
          'PRIMARY KEY',
        ],
        correctIndex: 3,
        explanation:
          'PRIMARY KEY crea un índice único automáticamente sobre la columna.',
      },
      {
        id: 'avz-sql-1',
        order: 5,
        prompt:
          'Escribe una consulta que muestre el total gastado por cada usuario. Muestra user_id y la suma con el alias "total_gastado", ordenado de mayor a menor.',
        seedSql:
          'SELECT user_id, SUM(total) AS total_gastado FROM orders GROUP BY user_id ORDER BY total_gastado DESC;',
        explanation:
          'GROUP BY user_id agrupa pedidos por usuario y SUM(total) suma sus importes. ORDER BY total_gastado DESC ordena de mayor a menor.',
      },
      {
        id: 'avz-sql-2',
        order: 6,
        prompt:
          'Escribe una consulta que devuelva el nombre de los productos de la categoría "Lácteos", usando un JOIN con categories.',
        seedSql:
          "SELECT p.name FROM products p JOIN categories c ON p.category_id = c.id WHERE c.name = 'Lácteos';",
        explanation:
          'El JOIN conecta products con categories y WHERE filtra por el nombre de la categoría.',
      },
    ],
  },
];

async function seedExercises(): Promise<void> {
  for (const item of exercises) {
    const checkSql = item.checkSql ?? item.seedSql;
    const expectedResult = await expectedResultFor(item.seedSql, item.checkSql);
    await db
      .insert(exercise)
      .values({
        id: item.id,
        lessonSlug: item.lessonSlug,
        title: item.title,
        prompt: item.prompt,
        difficulty: item.difficulty,
        expectedResult,
        explanation: item.explanation,
        order: item.order,
      })
      .onConflictDoUpdate({
        target: exercise.id,
        set: {
          lessonSlug: item.lessonSlug,
          title: item.title,
          prompt: item.prompt,
          difficulty: item.difficulty,
          expectedResult,
          checkSql: item.checkSql ?? null,
          explanation: item.explanation,
          order: item.order,
        },
      });
  }
  console.log(`✔ ${exercises.length} ejercicios sincronizados`);
}

async function seedExams(): Promise<void> {
  for (const examSeed of exams) {
    await db
      .insert(exam)
      .values({
        id: examSeed.id,
        slug: examSeed.slug,
        title: examSeed.title,
        description: examSeed.description,
        passScore: examSeed.passScore,
        durationMinutes: examSeed.durationMinutes,
        order: examSeed.order,
      })
      .onConflictDoUpdate({
        target: exam.id,
        set: {
          title: examSeed.title,
          description: examSeed.description,
          passScore: examSeed.passScore,
          durationMinutes: examSeed.durationMinutes,
          order: examSeed.order,
        },
      });

    for (const q of examSeed.questions) {
      if ('options' in q) {
        const mc = q as McQuestionSeed;
        await db
          .insert(examQuestion)
          .values({
            id: mc.id,
            examId: examSeed.id,
            order: mc.order,
            type: 'multiple_choice',
            prompt: mc.prompt,
            options: mc.options,
            correctIndex: mc.correctIndex,
            explanation: mc.explanation,
          })
          .onConflictDoUpdate({
            target: examQuestion.id,
            set: {
              order: mc.order,
              prompt: mc.prompt,
              options: mc.options,
              correctIndex: mc.correctIndex,
              explanation: mc.explanation,
            },
          });
      } else {
        const sqlQ = q as SqlQuestionSeed;
        const checkSql = sqlQ.checkSql ?? sqlQ.seedSql;
        const expectedResult = await expectedResultFor(sqlQ.seedSql, sqlQ.checkSql);
        await db
          .insert(examQuestion)
          .values({
            id: sqlQ.id,
            examId: examSeed.id,
            order: sqlQ.order,
            type: 'sql',
            prompt: sqlQ.prompt,
            expectedResult,
            checkSql: sqlQ.checkSql ?? null,
            explanation: sqlQ.explanation,
          })
          .onConflictDoUpdate({
            target: examQuestion.id,
            set: {
              order: sqlQ.order,
              prompt: sqlQ.prompt,
              expectedResult,
              checkSql: sqlQ.checkSql ?? null,
              explanation: sqlQ.explanation,
            },
          });
      }
    }
  }
  console.log(`✔ ${exams.length} exámenes sincronizados`);
}

async function main(): Promise<void> {
  try {
    await seedExercises();
    await seedExams();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error durante el seed:', err);
  process.exit(1);
});