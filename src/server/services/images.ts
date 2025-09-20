import sharp from "sharp";
import fetch from "node-fetch";
import crypto from "node:crypto";

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${url}: ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).jpeg().toBuffer();
}

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).resize(512, 512, { fit: "inside" }).jpeg().toBuffer();
}

export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: buffer.length,
  };
}

export async function dhashHex(buf: Buffer): Promise<string> {
  const img = await sharp(buf).grayscale().resize(9, 8, { fit: "fill" }).raw()
    .toBuffer();
  let bits = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = img[y * 9 + x];
      const right = img[y * 9 + x + 1];
      bits += left < right ? "1" : "0";
    }
  }
  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

export function hamming(aHex: string, bHex: string) {
  const a = BigInt("0x" + aHex);
  const b = BigInt("0x" + bHex);
  let x = a ^ b;
  let count = 0;
  while (x) {
    x &= x - 1n;
    count++;
  }
  return count;
}
