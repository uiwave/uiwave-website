import { and, eq } from 'drizzle-orm';
import { getCollection } from 'astro:content';
import { db } from '../db';
import { lessonProgress } from '../schema';

export interface ProgressInfo {
  total: number;
  completed: number;
  percent: number;
  completedSlugs: string[];
  nextLessonSlug: string | null;
  lastCompletedSlug: string | null;
}

export async function getProgress(userId: string): Promise<ProgressInfo> {
  const lessons = (await getCollection('lessons')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const slugs = lessons.map((lesson) => lesson.data.slug);

  const rows = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true)));

  const completedSlugs = rows
    .map((row) => row.lessonSlug)
    .filter((slug) => slugs.includes(slug));

  const completedSet = new Set(completedSlugs);
  const nextLesson = lessons.find((lesson) => !completedSet.has(lesson.data.slug));

  return {
    total: slugs.length,
    completed: completedSlugs.length,
    percent: slugs.length === 0 ? 0 : Math.round((completedSlugs.length / slugs.length) * 100),
    completedSlugs,
    nextLessonSlug: nextLesson?.data.slug ?? null,
    lastCompletedSlug:
      [...lessons]
        .reverse()
        .find((lesson) => completedSet.has(lesson.data.slug))?.data.slug ?? null,
  };
}

export async function isLessonCompleted(
  userId: string,
  lessonSlug: string,
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonSlug, lessonSlug),
      ),
    );
  return Boolean(row?.completed);
}