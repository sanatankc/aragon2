import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { db } from "@/src/server/db";
import { images, jobs } from "@/src/server/db/schema";
import { uploadToS3 } from "@/src/server/services/s3";
import sharp from "sharp";
// @ts-ignore - heic-convert doesn't have types
import convert from "heic-convert";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string;

    console.log('Upload API called with:', { 
      fileName: file?.name, 
      fileType: file?.type, 
      fileSize: file?.size,
      submissionId 
    });

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(new Uint8Array(arrayBuffer));
    
    // Convert HEIC to PNG if needed
    let processedBuffer = fileBuffer;
    let finalMimeType = file.type;
    let finalFileName = file.name;
    
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      console.log('Converting HEIC to PNG...');
      try {
        // Convert HEIC to PNG using heic-convert
        const pngBuffer = await convert({
          buffer: fileBuffer as any,
          format: 'PNG',
          quality: 0.9
        });
        processedBuffer = Buffer.from(pngBuffer);
        finalMimeType = 'image/png';
        finalFileName = file.name.replace(/\.heic$/i, '.png');
        console.log('HEIC conversion successful');
      } catch (error) {
        console.error('HEIC conversion failed:', error);
        // If conversion fails, try to process as regular image
        processedBuffer = fileBuffer;
        finalMimeType = 'image/jpeg'; // Default fallback
        finalFileName = file.name.replace(/\.heic$/i, '.jpg');
      }
    }

    // Generate unique file key with correct extension
    const extension = finalMimeType === 'image/png' ? 'png' : 'jpg';
    const fileKey = `uploads/${submissionId}/${nanoid(12)}.${extension}`;

    // Upload to S3
    const s3Url = await uploadToS3(fileKey, processedBuffer, finalMimeType);

    console.log('Uploaded to S3:', s3Url);

    // Create image record in database
    const imageId = nanoid(12);
    
    await db.insert(images).values({
      id: imageId,
      submissionId,
      status: "uploaded",
      originalUrl: s3Url,
      sizeBytes: processedBuffer.length,
      mimeType: finalMimeType,
    });

    // Create processing job
    await db.insert(jobs).values({
      id: nanoid(12),
      imageId,
      type: "image.process",
      status: "queued",
    });

    console.log('Created database records for imageId:', imageId);

    return NextResponse.json({
      imageId,
      fileKey,
      url: s3Url,
      originalFileName: file.name,
      processedFileName: finalFileName,
      mimeType: finalMimeType,
      sizeBytes: processedBuffer.length,
    });

  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
