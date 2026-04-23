import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { env } from "./env";
import { loadGcpCredentials } from "./gcp-credentials";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const creds = loadGcpCredentials();
  if (!creds) {
    throw new Error(
      "Vertex AI credentials are not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }
  if (creds.kind === "file") {
    // The SDK reads GOOGLE_APPLICATION_CREDENTIALS from env automatically.
    process.env.GOOGLE_APPLICATION_CREDENTIALS = creds.path;
  } else {
    // Materialize inline JSON credentials to a temp file the SDK can read via ADC.
    const tmp = path.join(os.tmpdir(), "imaginai-sa.json");
    fs.writeFileSync(tmp, JSON.stringify(creds.credentials), { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmp;
  }
  client = new GoogleGenAI({
    vertexai: true,
    project: env.GCP_PROJECT_ID,
    location: env.GCP_LOCATION,
  });
  return client;
}

// ---------------------------------------------------------------------------
// Text generation (conversational replies, scope classifier, email summary).
// ---------------------------------------------------------------------------
export async function generateText(
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const c = getClient();
  const res = await c.models.generateContent({
    model: env.VERTEX_TEXT_MODEL,
    contents: prompt,
    ...(systemInstruction
      ? { config: { systemInstruction } }
      : {}),
  });
  const text = res.text;
  if (!text) throw new Error("Vertex text generation returned no text");
  return text.trim();
}

// ---------------------------------------------------------------------------
// Image generation ("Nano Banana" — gemini-2.5-flash-image).
// ---------------------------------------------------------------------------
export interface ReferenceImage {
  /** Raw image bytes of the reference to be edited. */
  buffer: Buffer;
  /** MIME type, e.g. "image/png". Defaults to png. */
  mimeType?: string;
}

/**
 * Generate a new image from a text prompt, optionally using a reference image
 * as a visual anchor. When `reference` is provided, gemini-2.5-flash-image
 * will edit the reference — keeping unspecified attributes untouched — rather
 * than regenerating the scene from scratch. This is the mechanism behind the
 * "intelligent refinement" flow: a dislike + rework comment becomes an
 * in-place edit of the previous image.
 */
export async function generateImage(
  prompt: string,
  reference?: ReferenceImage,
): Promise<Buffer> {
  const c = getClient();
  const contents = reference
    ? [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: reference.buffer.toString("base64"),
                mimeType: reference.mimeType ?? "image/png",
              },
            },
            { text: prompt },
          ],
        },
      ]
    : prompt;
  const res = await c.models.generateContent({
    model: env.VERTEX_IMAGE_MODEL,
    contents,
  });
  const candidates = res.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      const inline = (part as { inlineData?: { data?: string; mimeType?: string } }).inlineData;
      if (inline?.data) {
        return Buffer.from(inline.data, "base64");
      }
    }
  }
  throw new Error("Vertex image generation returned no image data");
}
