import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readFileSync } from "fs";

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

async function upload(localPath: string, key: string, contentType: string) {
  const data = readFileSync(localPath);
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );

  const url = PUBLIC_URL
    ? `${PUBLIC_URL}/${key}`
    : await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
        expiresIn: 3600 * 24 * 365,
      });

  console.log(`Uploaded ${key} → ${url}`);
  return url;
}

async function main() {
  const audioUrl = await upload(
    "/tmp/sadtalker_sample.wav",
    "samples/sadtalker_audio.wav",
    "audio/wav"
  );
  console.log(`\nSadTalker audio: ${audioUrl}`);

  const videoUrl = await upload(
    "/tmp/liveportrait_sample.mp4",
    "samples/liveportrait_driving.mp4",
    "video/mp4"
  );
  console.log(`LivePortrait video: ${videoUrl}`);
}

main().catch(console.error);
