import { NextResponse } from "next/server";
import { db } from "@/src/server/db";
import { images, validationResults } from "@/src/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const submissionId = (await params).id;

    const imagesInSubmission = await db.query.images.findMany({
      where: eq(images.submissionId, submissionId)
    });

    console.log('imagesInSubmission...', imagesInSubmission);

    const imageDTOs = imagesInSubmission.map((img) => ({
      id: img.id,
      submissionId: img.submissionId,
      status: img.status,
      originalUrl: img.originalUrl,
      processedUrl: img.processedUrl || undefined,
      thumbUrl: img.thumbUrl || undefined,
      width: img.width || undefined,
      height: img.height || undefined,
      sizeBytes: img.sizeBytes || undefined,
      mimeType: img.mimeType || undefined,
      rejectionSummary: img.rejectionSummary || undefined,
      // reasons: img.validationResults.map((vr: any) => ({
      //   code: vr.code,
      //   message: vr.message,
      // })),
      createdAt: img.createdAt.toISOString(),
      updatedAt: img.updatedAt.toISOString(),
    }));

    return NextResponse.json({ items: imageDTOs });
  } catch (error) {
    console.error("Error fetching images for submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
