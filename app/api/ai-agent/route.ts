import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { buildAgentPrompt, generateMockAgentResult } from "@/lib/ai/agent-prompt";
import type { AgentScreeningRequest } from "@/lib/ai/agent-prompt";

const GeneResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string(),
  score: z.number(),
  reasoning: z.string(),
  evidence: z.array(z.string()),
  suggestedExperiment: z.string(),
});

const ScreeningResultSchema = z.object({
  genes: z.array(GeneResultSchema),
  summary: z.string(),
  confidence: z.number(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const request = body as AgentScreeningRequest;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    await simulateDelay(800);
    const result = generateMockAgentResult(request);
    return NextResponse.json(result);
  }

  try {
    const prompt = buildAgentPrompt(request);

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ScreeningResultSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Agent screening failed";
    console.error("Agent API error:", message);
    const fallback = generateMockAgentResult(request);
    return NextResponse.json({ ...fallback, _fallback: true });
  }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
