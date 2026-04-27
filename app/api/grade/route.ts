import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";

const GradeSchema = z.object({
  score: z.number(),
  feedback: z.string(),
  reasoning: z.string(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  aiDetection: z.object({
    aiProbability: z.number(),
    level: z.enum(["LOW", "MEDIUM", "HIGH"]),
    reason: z.string(),
  }),
});

type GradeResult = z.infer<typeof GradeSchema>;

export async function POST(req: Request) {
  try {
    const { question, answer, rubric } = await req.json();

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }
    if (!answer?.trim()) {
      return NextResponse.json(
        { error: "answer is required" },
        { status: 400 }
      );
    }

    const effectiveRubric =
      rubric?.trim() ||
      "Grade on clarity, accuracy, depth of understanding, and completeness. Score out of 10.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI teaching assistant that grades student answers AND estimates whether the answer may have been AI-assisted. " +
            "Use the SAME detection criteria as the academic integrity assistant: " +
            "focus on patterns like repetitive structure, generic filler phrases, sudden topic jumps, " +
            "overly polished yet shallow explanations, or contradictions. " +
            "Do NOT assume AI use just because the writing is good. " +
            "Always respond with a single JSON object only.",
        },
        {
          role: "user",
          content: `
You will grade the student's answer according to the rubric and also estimate AI usage.

QUESTION:
${question}

STUDENT ANSWER:
${answer}

RUBRIC:
${effectiveRubric}

SCALE FOR aiDetection.aiProbability (0 to 1), which will be shown as a percentage:
- 0.00–0.25  (0–25%): LOW — likely human or lightly assisted.
- 0.25–0.60 (25–60%): MEDIUM — mixed / uncertain signals.
- 0.60–1.00 (60–100%): HIGH — strong indications of AI-style text.

Return ONLY valid JSON in this format:
{
  "score": number,
  "feedback": "string",
  "reasoning": "string",
  "confidence": "HIGH | MEDIUM | LOW",
  "aiDetection": {
    "aiProbability": number,
    "level": "LOW | MEDIUM | HIGH",
    "reason": "string"
  }
}
          `,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: GradeResult;
    try {
      parsed = GradeSchema.parse(JSON.parse(raw));
    } catch {
      parsed = {
        score: 0,
        feedback: "Unable to parse model output.",
        reasoning: "Parsing failed or schema mismatch.",
        confidence: "LOW",
        aiDetection: {
          aiProbability: 0,
          level: "LOW",
          reason: "Parsing failed or schema mismatch.",
        },
      };
    }

    let calibrated = Math.min(Math.max(parsed.aiDetection.aiProbability, 0), 1);

    let finalLevel: GradeResult["aiDetection"]["level"];
    if (calibrated <= 0.25) finalLevel = "LOW";
    else if (calibrated <= 0.6) finalLevel = "MEDIUM";
    else finalLevel = "HIGH";

    const output: GradeResult = {
      ...parsed,
      aiDetection: {
        ...parsed.aiDetection,
        aiProbability: calibrated,
        level: finalLevel,
      },
    };

    return NextResponse.json(output);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Grading failed" }, { status: 500 });
  }
}