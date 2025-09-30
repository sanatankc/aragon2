import 'dotenv/config';
import { db } from "@/src/server/db";
import { jobs, images, validationResults } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";
import { downloadImage, generateThumbnail, sha256, getImageMetadata, dhashHex } from "@/src/server/services/images";
import { runPipeline, getAllValidators, ValidationContext, ValidationResult } from "@/src/server/services/validate";

async function processJob() {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.status, "queued"),
  });

  if (!job) {
    console.log("No queued jobs found. Waiting...");
    return;
  }

  console.log(`Processing job ${job.id} for image ${job.imageId}`);

  await db
    .update(jobs)
    .set({ status: "running", attempts: job.attempts + 1 })
    .where(eq(jobs.id, job.id));

  try {
    const imageRecord = await db.query.images.findFirst({
      where: eq(images.id, job.imageId),
    });

    if (!imageRecord) {
      throw new Error(`Image record not found for job ${job.id}`);
    }

    let originalBuffer = await downloadImage(imageRecord.originalUrl);
    let processedBuffer = originalBuffer;
    let mimeType = imageRecord.mimeType;

    // HEIC files are now converted to PNG during upload, so no conversion needed here

    const thumbnailBuffer = await generateThumbnail(processedBuffer);
    const imageSha256 = sha256(processedBuffer);
    const imagePhash = await dhashHex(processedBuffer);
    const metadata = await getImageMetadata(processedBuffer);

    const validationContext: ValidationContext = {
      original: originalBuffer,
      processed: processedBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      sizeBytes: originalBuffer.length,
      mime: mimeType || "",
      sha256: imageSha256,
      phash: imagePhash,
      submissionId: imageRecord.submissionId,
      imageId: imageRecord.id,
    };

    const allValidators = getAllValidators();
    const allValidationResults = await runPipeline(validationContext, allValidators);

    if (allValidationResults.length > 0) {
      // Persist detailed validation results
      for (const vr of allValidationResults) {
        await db.insert(validationResults).values({
          id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
          imageId: job.imageId,
          code: vr.code,
          message: vr.message,
          details: vr.details as any,
        });
      }
      await db
        .update(images)
        .set({
          status: "rejected",
          rejectionSummary: allValidationResults[0].message,
        })
        .where(eq(images.id, job.imageId));
      await db
        .update(jobs)
        .set({ status: "done" })
        .where(eq(jobs.id, job.id));
      console.log(`Image ${imageRecord.id} rejected due to validation.`);
      return;
    }

    console.log("Processed image metadata:", metadata);
    console.log("SHA256:", imageSha256);
    console.log("pHash:", imagePhash);

    // For now, just mark as accepted and update metadata
    await db
      .update(images)
      .set({
        status: "accepted",
        processedUrl: imageRecord.originalUrl, // Placeholder for now
        thumbUrl: imageRecord.originalUrl, // Placeholder for now
        width: metadata.width,
        height: metadata.height,
        sizeBytes: metadata.size,
        mimeType: mimeType,
        sha256: imageSha256,
        phash: imagePhash,
      })
      .where(eq(images.id, job.imageId));

    await db
      .update(jobs)
      .set({ status: "done" })
      .where(eq(jobs.id, job.id));

    console.log(`Job ${job.id} completed successfully.`);
  } catch (error: any) {
    console.error(`Job ${job.id} failed:`, error);
    await db
      .update(jobs)
      .set({ status: "error", lastError: error.message })
      .where(eq(jobs.id, job.id));
    await db
      .update(images)
      .set({ status: "failed" })
      .where(eq(images.id, job.imageId));
  }
}

async function workerLoop() {
  while (true) {
    await processJob();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before checking for new jobs
  }
}

workerLoop();
