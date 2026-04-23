import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { Storage } from "@google-cloud/storage";

const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!saJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");
const tmp = path.join(os.tmpdir(), "imaginai-sa.json");
fs.writeFileSync(tmp, saJson, { mode: 0o600 });
process.env.GOOGLE_APPLICATION_CREDENTIALS = tmp;

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION ?? "us-central1";
const bucketName = process.env.GCS_BUCKET_NAME;

console.log("project:", projectId, "location:", location, "bucket:", bucketName);

const ai = new GoogleGenAI({ vertexai: true, project: projectId, location });

console.log("— text —");
const txt = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Diga 'olá ImaginAI' em português, só isso.",
});
console.log(txt.text);

console.log("— image (gemini-2.5-flash-image) —");
try {
  const img = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents:
      "Gere uma imagem fotorrealista de um armário branco moderno para banheiro, 3/4 view, fundo neutro.",
  });
  let found = 0;
  for (const c of img.candidates ?? []) {
    for (const part of c.content?.parts ?? []) {
      const inline = part.inlineData;
      if (inline?.data) {
        const buf = Buffer.from(inline.data, "base64");
        console.log("image bytes:", buf.length, "mime:", inline.mimeType);
        fs.writeFileSync("/tmp/imaginai-test.png", buf);
        found++;
      }
    }
  }
  if (!found) console.log("NO IMAGE IN RESPONSE", JSON.stringify(img, null, 2).slice(0, 1000));
} catch (e) {
  console.error("image ERR:", e.message);
}

console.log("— GCS —");
try {
  const storage = new Storage({ projectId });
  const bucket = storage.bucket(bucketName);
  const [exists] = await bucket.exists();
  console.log("bucket exists:", exists);
  if (fs.existsSync("/tmp/imaginai-test.png")) {
    const file = bucket.file(`smoke/${Date.now()}.png`);
    await file.save(fs.readFileSync("/tmp/imaginai-test.png"), { contentType: "image/png" });
    const [signed] = await file.getSignedUrl({
      action: "read",
      version: "v4",
      expires: Date.now() + 60 * 60 * 1000,
    });
    console.log("uploaded signed URL:", signed.slice(0, 80) + "...");
  }
} catch (e) {
  console.error("gcs ERR:", e.message);
}
