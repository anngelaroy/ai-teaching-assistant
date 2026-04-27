import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";

const ActivitySchema = z.object({
  title: z.string(),
  type: z.enum([
    "THINK_PAIR_SHARE",
    "SMALL_GROUP",
    "WHOLE_CLASS_DISCUSSION",
    "CASE_ACTIVITY",
    "QUIZ_CHECK",
    "REFLECTION",
  ]),
  durationMinutes: z.number(),
  goal: z.string(),
  instructions: z.string(),
  inClassPrompt: z.string(),
  expectedStudentBehaviors: z.string(),
});

const ActivitiesSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  activities: z.array(ActivitySchema),
});

type ActivitiesResult = z.infer<typeof ActivitiesSchema>;

export async function POST(req: Request) {
  try {
    const { topic, difficulty, numActivities, materialSummary } =
      await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty must be EASY, MEDIUM, or HARD" },
        { status: 400 }
      );
    }

    const count = Math.max(1, Math.min(Number(numActivities) || 3, 10));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI teaching assistant that designs concrete, classroom-ready activities for university courses. " +
            "You must output valid JSON only.",
        },
        {
          role: "user",
          content: `
Design ${count} short in-class activities.

COURSE TOPIC:
${topic}

TARGET DIFFICULTY:
${difficulty} (EASY, MEDIUM, HARD)

OPTIONAL MATERIAL SUMMARY (may be empty):
${materialSummary?.trim() || "(none provided)"}

CONTEXT:
- Activities will be used in a 50–75 minute in-person or synchronous class.
- Students are university-level.
- Activities should be concrete, doable, and clearly described.
- Prefer active learning: discussion, problem-solving, short cases, or think-pair-share.
- Each activity should be 5–20 minutes.

ACTIVITY TYPES (use one of these):
- THINK_PAIR_SHARE
- SMALL_GROUP
- WHOLE_CLASS_DISCUSSION
- CASE_ACTIVITY
- QUIZ_CHECK
- REFLECTION

Return ONLY valid JSON in this exact format:
{
  "topic": "string",
  "difficulty": "EASY | MEDIUM | HARD",
  "activities": [
    {
      "title": "string",
      "type": "THINK_PAIR_SHARE | SMALL_GROUP | WHOLE_CLASS_DISCUSSION | CASE_ACTIVITY | QUIZ_CHECK | REFLECTION",
      "durationMinutes": 10,
      "goal": "string",
      "instructions": "string",
      "inClassPrompt": "string",
      "expectedStudentBehaviors": "string"
    }
  ]
}
        `,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: ActivitiesResult;
    try {
      parsed = ActivitiesSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error("Activities parse error:", err, "raw:", raw);
      parsed = {
        topic,
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
        activities: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Activity generation failed" },
      { status: 500 }
    );
  }
}