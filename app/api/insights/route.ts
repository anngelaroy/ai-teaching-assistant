import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";

const InsightsSchema = z.object({
  summary: z.string(),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

type Insights = z.infer<typeof InsightsSchema>;

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "students must be a non-empty array" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI teaching assistant analyzing student engagement data. " +
            "Given an array of student objects (name, uploads, lastActive days ago), " +
            "identify at-risk students, summarize class-wide engagement trends, " +
            "and give concrete, actionable recommendations for the instructor. " +
            "Always respond with a single JSON object only.",
        },
        {
          role: "user",
          content: `
STUDENT DATA:
${JSON.stringify(students, null, 2)}

Analyze the data above and return ONLY valid JSON in this format:
{
  "summary": "A 2–3 sentence summary of overall class engagement",
  "risks": ["Student or pattern that needs attention", "..."],
  "recommendations": ["Concrete action for the instructor", "..."]
}
          `,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: Insights;
    try {
      parsed = InsightsSchema.parse(JSON.parse(raw));
    } catch {
      return NextResponse.json({
        summary: "Parsing failed",
        risks: ["Invalid model output"],
        recommendations: ["Retry request"],
      });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        summary: "Server error",
        risks: ["Request failed"],
        recommendations: ["Check API key / request"],
      },
      { status: 500 }
    );
  }
}