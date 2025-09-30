import { pgTable, varchar, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const imageStatus = pgEnum("image_status", [
  "pending_upload",
  "uploaded",
  "processing",
  "accepted",
  "rejected",
  "failed",
]);

export const submissions = pgTable("submissions", {
  id: varchar("id", { length: 32 }).primaryKey(),
  label: varchar("label", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const images = pgTable("images", {
  id: varchar("id", { length: 32 }).primaryKey(),
  submissionId: varchar("submission_id", { length: 32 })
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  status: imageStatus("status").notNull().default("pending_upload"),
  extraData: jsonb("extra_data"),
  originalUrl: text("original_url").notNull(),
  processedUrl: text("processed_url"),
  thumbUrl: text("thumb_url"),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  mimeType: varchar("mime_type", { length: 60 }),
  sha256: varchar("sha256", { length: 64 }),
  phash: varchar("phash", { length: 64 }),
  rejectionSummary: text("rejection_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const validationResults = pgTable("validation_results", {
  id: varchar("id", { length: 32 }).primaryKey(),
  imageId: varchar("image_id", { length: 32 })
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 60 }).notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 32 }).primaryKey(),
  imageId: varchar("image_id", { length: 32 })
    .notNull()
    .references(() => images.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 40 }).notNull(), // 'image.process'
  status: varchar("status", { length: 20 })
    .notNull()
    .default("queued"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
