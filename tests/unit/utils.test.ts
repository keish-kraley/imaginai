import { describe, expect, it } from "vitest";
import { truncate, cn } from "@/lib/utils";

describe("utils", () => {
  it("truncate adds ellipsis when over max", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
  });
  it("truncate leaves short strings alone", () => {
    expect(truncate("hi", 5)).toBe("hi");
  });
  it("cn merges class names", () => {
    expect(cn("a", "b", false && "c")).toBe("a b");
  });
});
