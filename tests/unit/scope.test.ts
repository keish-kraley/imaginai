import { describe, expect, it } from "vitest";
import { localClassify } from "@/lib/scope";

describe("localClassify", () => {
  it("classifies home items as generate_image", () => {
    const r = localClassify("Quero uma mesa de madeira clara para a sala.");
    expect(r.intent).toBe("generate_image");
  });

  it("classifies a plain greeting as conversational", () => {
    const r = localClassify("oi");
    expect(r.intent).toBe("conversational");
  });

  it("blocks out-of-scope prompts", () => {
    const r = localClassify("uma praia linda com coqueiros");
    expect(r.intent).toBe("out_of_scope");
  });

  it("blocks car prompts", () => {
    const r = localClassify("um carro esportivo vermelho");
    expect(r.intent).toBe("out_of_scope");
  });
});
