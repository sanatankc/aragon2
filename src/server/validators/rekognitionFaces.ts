import { DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { getRekognitionClient } from "@/src/server/services/rekognition";
import type { Validator, ValidationResult } from "@/src/server/services/validate";

const MIN_FACE_PERCENTAGE = Number(process.env.MIN_FACE_PERCENTAGE ?? 5); // percent of image area

export const rekognitionFacesValidator: Validator = async (ctx) => {
  const results: ValidationResult[] = [];
  try {
    const client = getRekognitionClient();
    const command = new DetectFacesCommand({
      Image: { Bytes: ctx.original },
      Attributes: ["DEFAULT"],
    });
    const resp = await client.send(command);
    const faces = resp.FaceDetails ?? [];

    console.log("faces", faces);

    if (faces.length === 0) {
      results.push({
        code: "NO_FACE",
        message: "No face detected in the image",
        details: { detectedFaces: 0 },
      });
      return results;
    }

    if (faces.length > 1) {
      results.push({
        code: "MULTIPLE_FACES",
        message: `Multiple faces detected (${faces.length})`,
        details: {
          detectedFaces: faces.length,
          boxes: faces.map((f) => f.BoundingBox).filter(Boolean),
        },
      });
      return results;
    }

    const box = faces[0].BoundingBox;
    if (box && box.Width != null && box.Height != null) {
      const faceArea = box.Width * box.Height * ctx.width * ctx.height; // relative -> pixels
      const imageArea = ctx.width * ctx.height;
      const facePct = (faceArea / imageArea) * 100;
      if (facePct < MIN_FACE_PERCENTAGE) {
        results.push({
          code: "FACE_TOO_SMALL",
          message: `Detected face is too small`,
          details: { facePct, minRequired: MIN_FACE_PERCENTAGE, box },
        });
      }
    }

    return results;
  } catch (error) {
    console.log("error", error);
    results.push({
      code: "NO_FACE",
      message: "Face detection failed",
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    return results;
  }
};


