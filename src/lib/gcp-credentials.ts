// Normalizes GCP credential configuration so all SDK calls use the same source.
//
// Priority:
//   1. GOOGLE_APPLICATION_CREDENTIALS (file path) — passed through as-is.
//   2. GOOGLE_SERVICE_ACCOUNT_JSON (raw JSON string) — parsed and returned as
//      credentials object.
//
// Returns `null` when no credentials are available so callers can fall back
// to a non-GCP code path during development.

export type GcpCredentials =
  | { kind: "file"; path: string }
  | { kind: "inline"; credentials: Record<string, unknown> }
  | null;

export function loadGcpCredentials(): GcpCredentials {
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath) return { kind: "file", path: filePath };

  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      return { kind: "inline", credentials: parsed };
    } catch (err) {
      console.warn("[gcp] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", err);
      return null;
    }
  }

  return null;
}
