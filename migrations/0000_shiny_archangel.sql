CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"color" text DEFAULT '#6B7280' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'waiting' NOT NULL,
	"current_team_id" integer,
	"current_question_id" integer,
	"timer_seconds" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer_given" text,
	"is_correct" boolean,
	"answered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text_en" text NOT NULL,
	"text_ar" text NOT NULL,
	"option_a_en" text NOT NULL,
	"option_a_ar" text NOT NULL,
	"option_b_en" text NOT NULL,
	"option_b_ar" text NOT NULL,
	"option_c_en" text NOT NULL,
	"option_c_ar" text NOT NULL,
	"option_d_en" text NOT NULL,
	"option_d_ar" text NOT NULL,
	"correct_answer" text NOT NULL,
	"category_en" text NOT NULL,
	"category_ar" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"questions_answered" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"color" text NOT NULL,
	"captain" text NOT NULL,
	"secret_key" text DEFAULT '000000' NOT NULL,
	"members" text[] DEFAULT '{}'::text[] NOT NULL
);
