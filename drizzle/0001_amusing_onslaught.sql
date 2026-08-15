CREATE TABLE "certificate" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_name" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"pass_score" integer DEFAULT 70 NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exam_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "exam_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"passed" boolean NOT NULL,
	"answers" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_question" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb,
	"correct_index" integer,
	"expected_result" jsonb,
	"explanation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_slug" text NOT NULL,
	"title" text NOT NULL,
	"prompt" text NOT NULL,
	"difficulty" text DEFAULT 'easy' NOT NULL,
	"expected_result" jsonb NOT NULL,
	"explanation" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"exercise_id" text NOT NULL,
	"user_id" text NOT NULL,
	"sql" text NOT NULL,
	"correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_slug" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_public_profile" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempt" ADD CONSTRAINT "exam_attempt_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempt" ADD CONSTRAINT "exam_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_question" ADD CONSTRAINT "exam_question_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempt" ADD CONSTRAINT "exercise_attempt_exercise_id_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempt" ADD CONSTRAINT "exercise_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "certificate_user_idx" ON "certificate" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exam_attempt_exam_idx" ON "exam_attempt" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_attempt_user_idx" ON "exam_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exam_question_exam_idx" ON "exam_question" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exercise_lesson_slug_idx" ON "exercise" USING btree ("lesson_slug");--> statement-breakpoint
CREATE INDEX "exercise_attempt_exercise_idx" ON "exercise_attempt" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "exercise_attempt_user_idx" ON "exercise_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_user_lesson_idx" ON "lesson_progress" USING btree ("user_id","lesson_slug");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");