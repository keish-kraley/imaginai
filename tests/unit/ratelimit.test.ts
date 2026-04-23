import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/ratelimit";

describe("checkRateLimit", () => {
  it("allows up to limit and blocks after", () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    const limit = 3;
    let okCount = 0;
    for (let i = 0; i < limit; i++) {
      if (checkRateLimit(key, limit).ok) okCount++;
    }
    expect(okCount).toBe(limit);
    const denied = checkRateLimit(key, limit);
    expect(denied.ok).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });
});
