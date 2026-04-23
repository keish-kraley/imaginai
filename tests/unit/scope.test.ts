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

  it("flags a short tweak after an existing image as a refinement", () => {
    const r = localClassify("agora em verde", {
      previousImagePrompt: "um armário vermelho para banheiro pequeno",
    });
    expect(r.intent).toBe("generate_image");
    expect(r.isRefinement).toBe(true);
  });

  it("does not set refinement when there is no previous image", () => {
    const r = localClassify("um armário vermelho");
    expect(r.intent).toBe("generate_image");
    expect(r.isRefinement).toBeFalsy();
  });
});
