import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export { user, session, account, verification } from "./auth-schema";

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonSlug: text("lesson_slug").notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("lesson_progress_user_lesson_idx").on(
      table.userId,
      table.lessonSlug,
    ),
  ],
);

export const exercise = pgTable(
  "exercise",
  {
    id: text("id").primaryKey(),
    lessonSlug: text("lesson_slug").notNull(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    difficulty: text("difficulty", {
      enum: ["easy", "medium", "hard"],
    })
      .default("easy")
      .notNull(),
    expectedResult: jsonb("expected_result").notNull(),
    checkSql: text("check_sql"),
    explanation: text("explanation"),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("exercise_lesson_slug_idx").on(table.lessonSlug)],
);

export const exerciseAttempt = pgTable(
  "exercise_attempt",
  {
    id: text("id").primaryKey(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sql: text("sql").notNull(),
    correct: boolean("correct").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("exercise_attempt_exercise_idx").on(table.exerciseId),
    index("exercise_attempt_user_idx").on(table.userId),
  ],
);

export const exam = pgTable("exam", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  passScore: integer("pass_score").default(70).notNull(),
  durationMinutes: integer("duration_minutes").default(30).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const examQuestion = pgTable(
  "exam_question",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => exam.id, { onDelete: "cascade" }),
    order: integer("order").default(0).notNull(),
    type: text("type", { enum: ["multiple_choice", "sql"] }).notNull(),
    prompt: text("prompt").notNull(),
    options: jsonb("options"),
    correctIndex: integer("correct_index"),
    expectedResult: jsonb("expected_result"),
    checkSql: text("check_sql"),
    explanation: text("explanation"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("exam_question_exam_idx").on(table.examId)],
);

export const examAttempt = pgTable(
  "exam_attempt",
  {
    id: text("id").primaryKey(),
    examId: text("exam_id")
      .notNull()
      .references(() => exam.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    answers: jsonb("answers").notNull(),
    results: jsonb("results").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("exam_attempt_exam_idx").on(table.examId),
    index("exam_attempt_user_idx").on(table.userId),
  ],
);

export const certificate = pgTable(
  "certificate",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseName: text("course_name").notNull(),
    issuedAt: timestamp("issued_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("certificate_user_idx").on(table.userId)],
);

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(user, {
    fields: [lessonProgress.userId],
    references: [user.id],
  }),
}));

export const exerciseRelations = relations(exercise, ({ many }) => ({
  attempts: many(exerciseAttempt),
}));

export const exerciseAttemptRelations = relations(exerciseAttempt, ({ one }) => ({
  exercise: one(exercise, {
    fields: [exerciseAttempt.exerciseId],
    references: [exercise.id],
  }),
  user: one(user, {
    fields: [exerciseAttempt.userId],
    references: [user.id],
  }),
}));

export const examRelations = relations(exam, ({ many }) => ({
  questions: many(examQuestion),
  attempts: many(examAttempt),
}));

export const examQuestionRelations = relations(examQuestion, ({ one }) => ({
  exam: one(exam, {
    fields: [examQuestion.examId],
    references: [exam.id],
  }),
}));

export const examAttemptRelations = relations(examAttempt, ({ one }) => ({
  exam: one(exam, {
    fields: [examAttempt.examId],
    references: [exam.id],
  }),
  user: one(user, {
    fields: [examAttempt.userId],
    references: [user.id],
  }),
}));

export const certificateRelations = relations(certificate, ({ one }) => ({
  user: one(user, {
    fields: [certificate.userId],
    references: [user.id],
  }),
}));