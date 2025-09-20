CREATE TYPE "public"."image_status" AS ENUM('pending_upload', 'uploaded', 'processing', 'accepted', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE "images" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"submission_id" varchar(32) NOT NULL,
	"status" "image_status" DEFAULT 'pending_upload' NOT NULL,
	"original_url" text NOT NULL,
	"processed_url" text,
	"thumb_url" text,
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"mime_type" varchar(60),
	"sha256" varchar(64),
	"phash" varchar(64),
	"rejection_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"image_id" varchar(32) NOT NULL,
	"type" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"label" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validation_results" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"image_id" varchar(32) NOT NULL,
	"code" varchar(60) NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;