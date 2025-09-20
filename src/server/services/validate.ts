import { Buffer } from "node:buffer";
import { db } from "@/src/server/db";
import { images } from "@/src/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { hamming } from "../services/images";
import { blurValidator, faceDetectionValidator } from "../validators";

export type ValidationContext = {
  original: Buffer;
  processed: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
  mime: string;
  sha256: string;
  phash: string;
  submissionId: string;
  imageId: string;
};

export type ValidationResult = {
  code:
    | "UNSUPPORTED_FORMAT"
    | "FILE_TOO_SMALL"
    | "SMALL_RESOLUTION"
    | "DUPLICATE"
    | "TOO_SIMILAR"
    | "BLURRY"
    | "NO_FACE"
    | "MULTIPLE_FACES"
    | "FACE_TOO_SMALL";
  message: string;
  details?: Record<string, unknown>;
};

export type Validator = (ctx: ValidationContext) => Promise<ValidationResult[]>;

export async function runPipeline(
  ctx: ValidationContext,
  validators: Validator[],
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const v of validators) {
    const r = await v(ctx);
    results.push(...r);
  }
  return results;
}

export const formatValidator: Validator = async (ctx) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/heic"];
  
  // Simple format validation based on MIME type from context
  if (!ctx.mime || !allowedMimes.includes(ctx.mime)) {
    return [
      {
        code: "UNSUPPORTED_FORMAT",
        message: `Unsupported file format: ${ctx.mime || "unknown"}`,
      },
    ];
  }
  return [];
};

export const sizeAndResolutionValidator: Validator = async (ctx) => {
  const results: ValidationResult[] = [];
  const MIN_BYTES = 20 * 1024; // 20 KB
  const MIN_WIDTH = 400;
  const MIN_HEIGHT = 400;

  if (ctx.sizeBytes < MIN_BYTES) {
    results.push({
      code: "FILE_TOO_SMALL",
      message: `File size is too small (${(ctx.sizeBytes / 1024).toFixed(2)} KB). Minimum is ${(MIN_BYTES / 1024).toFixed(0)} KB.`,
    });
  }

  if (ctx.width < MIN_WIDTH || ctx.height < MIN_HEIGHT) {
    results.push({
      code: "SMALL_RESOLUTION",
      message: `Image resolution is too small (${ctx.width}x${ctx.height}). Minimum is ${MIN_WIDTH}x${MIN_HEIGHT}.`,
    });
  }

  return results;
};

export const duplicateValidator: Validator = async (ctx) => {
  const results: ValidationResult[] = [];
  const SIMILARITY_MAX_HAMMING = 8;

  // Exact duplicate check (sha256)
  const existingExactDuplicate = await db.query.images.findFirst({
    where: and(eq(images.submissionId, ctx.submissionId), eq(images.sha256, ctx.sha256)),
  });

  if (existingExactDuplicate) {
    results.push({
      code: "DUPLICATE",
      message: "An exact duplicate of this image already exists in this submission.",
    });
    return results;
  }

  // Near-duplicate check (pHash)
  const existingImagesWithSimilarPhash = await db.query.images.findMany({
    where: and(eq(images.submissionId, ctx.submissionId), sql`substring(${images.phash}, 1, 3) = substring(${ctx.phash}, 1, 3)`),
  });

  for (const existingImage of existingImagesWithSimilarPhash) {
    if (existingImage.phash) {
      const distance = hamming(ctx.phash, existingImage.phash);
      if (distance <= SIMILARITY_MAX_HAMMING) {
        results.push({
          code: "TOO_SIMILAR",
          message: `This image is too similar to an existing image (${existingImage.id}) in this submission.`, 
          details: { existingImageId: existingImage.id, hammingDistance: distance },
        });
        return results; // Only need to find one similar image to reject
      }
    }
  }

  return results;
};

/**
 * Get all available validators
 * This function returns all validators in the order they should be executed
 */
export function getAllValidators(): Validator[] {
  return [
    formatValidator,
    sizeAndResolutionValidator,
    duplicateValidator,
    blurValidator,
    // faceDetectionValidator,
  ];
}
