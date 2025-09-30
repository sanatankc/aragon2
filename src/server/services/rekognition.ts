import { RekognitionClient } from "@aws-sdk/client-rekognition";

let client: RekognitionClient | null = null;

export function getRekognitionClient(): RekognitionClient {
  if (!client) {
    client = new RekognitionClient({
      region: "us-east-1",
    });
  }
  return client;
}


