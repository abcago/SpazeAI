import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET ?? "spazeai";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export async function uploadImage(
  data: Buffer,
  folder: string = "generations"
): Promise<string> {
  const key = `${folder}/${randomUUID()}.jpg`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: "image/jpeg",
    })
  );

  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }

  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 * 24 * 7 }
  );
}

export async function uploadImageFromUrl(
  url: string,
  folder: string = "generations"
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image from ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return uploadImage(buffer, folder);
}

export async function uploadResultFromUrl(
  url: string,
  folder: string = "generations"
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch result from ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  return uploadBuffer(buffer, contentType, folder);
}

/** Upload a pre-fetched buffer to R2. Returns the public/signed URL. */
export async function uploadBuffer(
  buffer: Buffer,
  contentType: string,
  folder: string = "generations"
): Promise<string> {
  const ext = contentType.includes("video")
    ? "mp4"
    : contentType.includes("png")
      ? "png"
      : "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }

  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 * 24 * 7 }
  );
}

export async function uploadPreviewMedia(
  data: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );

  if (PUBLIC_URL) {
    return `${PUBLIC_URL}/${key}`;
  }

  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 * 24 * 7 }
  );
}

export async function deleteImage(key: string): Promise<void> {
  // Extract key from full URL if needed
  const objectKey = key.startsWith("http")
    ? key.replace(`${PUBLIC_URL}/`, "")
    : key;

  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    })
  );
}
