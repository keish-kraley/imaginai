const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
] as const;

export function assertServerEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

export const env = {
  get APP_URL() {
    return process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  },
  get ADMIN_EMAIL() {
    return process.env.ADMIN_EMAIL ?? "ideias@astra-sa.com";
  },
  get CONTACT_EMAIL() {
    return process.env.CONTACT_EMAIL ?? process.env.ADMIN_EMAIL ?? "contato@astra-sa.com";
  },
  get SMTP_FROM() {
    return process.env.SMTP_FROM ?? "ImaginAI <no-reply@astra-sa.com>";
  },
  get CHAT_RATE_LIMIT_PER_MINUTE() {
    return Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE ?? "30");
  },
  get GCP_PROJECT_ID() {
    return process.env.GCP_PROJECT_ID ?? "";
  },
  get GCP_LOCATION() {
    return process.env.GCP_LOCATION ?? "us-central1";
  },
  get VERTEX_IMAGE_MODEL() {
    return process.env.VERTEX_IMAGE_MODEL ?? "gemini-2.5-flash-image";
  },
  get VERTEX_TEXT_MODEL() {
    return process.env.VERTEX_TEXT_MODEL ?? "gemini-2.5-flash";
  },
  get GCS_BUCKET_NAME() {
    return process.env.GCS_BUCKET_NAME ?? "";
  },
  get GCS_SIGNED_URL_EXPIRATION_DAYS() {
    return Number(process.env.GCS_SIGNED_URL_EXPIRATION_DAYS ?? "7");
  },
  get GCP_ENABLED() {
    return Boolean(
      process.env.GCP_PROJECT_ID &&
        process.env.GCS_BUCKET_NAME &&
        (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS),
    );
  },
  get SMTP_ENABLED() {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  },
};
