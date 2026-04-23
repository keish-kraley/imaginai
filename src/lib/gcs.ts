import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";
import { env } from "./env";
import { loadGcpCredentials } from "./gcp-credentials";

let storage: Storage | null = null;

function getStorage(): Storage {
  if (storage) return storage;
  const creds = loadGcpCredentials();
  if (!creds) {
    throw new Error(
      "GCS is not configured. Set GCP_PROJECT_ID, GCS_BUCKET_NAME and GOOGLE_SERVICE_ACCOUNT_JSON (or GOOGLE_APPLICATION_CREDENTIALS).",
    );
  }
  storage = new Storage({
    projectId: env.GCP_PROJECT_ID,
    ...(creds.kind === "inline"
      ? { credentials: creds.credentials }
      : { keyFilename: creds.path }),
  });
  return storage;
}

export interface UploadedImage {
  gcsKey: string;
  signedUrl: string;
}

export async function uploadGeneratedImage(
  buffer: Buffer,
  contentType = "image/png",
): Promise<UploadedImage> {
  if (!env.GCP_ENABLED) {
    throw new Error("GCP not configured; cannot upload to GCS");
  }
  const bucketName = env.GCS_BUCKET_NAME;
  const key = `generated/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.png`;
  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(key);
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "private, max-age=3600" },
  });
  const signedUrl = await signUrl(key);
  return { gcsKey: key, signedUrl };
}

export async function signUrl(gcsKey: string): Promise<string> {
  const bucketName = env.GCS_BUCKET_NAME;
  const file = getStorage().bucket(bucketName).file(gcsKey);
  const expires = Date.now() + env.GCS_SIGNED_URL_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires,
  });
  return url;
}
