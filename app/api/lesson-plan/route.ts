import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";

const SegmentSchema = z.object({
  title: z.string(),
  type: z.enum([
    "RECAP",
    "MINI_LECTURE",
    "DEMO",
    "DISCUSSION",
    "ACTIVITY",
    "CHECK_FOR_UNDERSTANDING",
    "WRAP_UP",
  ]),
  durationMinutes: z.number(),
  objective: z.string(),
  description: z.string(),
});

const WeeklyOutlineSchema = z.object({
  weekNumber: z.number(),
  theme: z.string(),
  keyOutcomes: z.string(),
  suggestedAssessment: z.string(),
});

const LessonPlanSchema = z.object({
  courseTitle: z.string(),
  weekTopic: z.string(),
  nextClass: z.object({
    objectiveSummary: z.string(),
    totalMinutes: z.number(),
    segments: z.array(SegmentSchema),
  }),
  weeklyOutline: z.array(WeeklyOutlineSchema),
});

type LessonPlanResult = z.infer<typeof LessonPlanSchema>;

export async function POST(req: Request) {
  try {
    const { courseTitle, weekTopic, weeksRemaining, meetingMinutes, notes } =
      await req.json();

    if (!courseTitle?.trim()) {
      return NextResponse.json(
        { error: "courseTitle is required" },
        { status: 400 }
      );
    }
    if (!weekTopic?.trim()) {
      return NextResponse.json(
        { error: "weekTopic is required" },
        { status: 400 }
      );
    }

    const weeks = Math.max(1, Math.min(Number(weeksRemaining) || 6, 16));
    const duration = Math.max(30, Math.min(Number(meetingMinutes) || 75, 180));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert university teaching assistant who creates concise, realistic lesson plans and course outlines. " +
            "You must output valid JSON only.",
        },
        {
          role: "user",
          content: `
Create a lesson plan and a short-term weekly outline.

COURSE TITLE:
${courseTitle}

CURRENT/WEEK TOPIC:
${weekTopic}

WEEKS REMAINING IN TERM (including this week):
${weeks}

TYPICAL CLASS MEETING LENGTH (minutes):
${duration}

OPTIONAL NOTES FROM INSTRUCTOR (recent issues, weaknesses, goals):
${notes?.trim() || "(none provided)"}

TASK:
1. Design a single next-class meeting:
   - Total time should be about ${duration} minutes.
   - Break into 4–8 segments (recap, short lecture, example, activity, check-for-understanding, wrap-up).
   - Use realistic times (5–25 minutes each).
   - Focus on active learning where possible.

2. Create a brief weekly outline for the remaining ${weeks} weeks:
   - For each week: theme, key learning outcomes, suggested assessment type or activity.

CLASS SEGMENT TYPES (use one):
- RECAP
- MINI_LECTURE
- DEMO
- DISCUSSION
- ACTIVITY
- CHECK_FOR_UNDERSTANDING
- WRAP_UP

Return ONLY valid JSON in this exact format:
{
  "courseTitle": "string",
  "weekTopic": "string",
  "nextClass": {
    "objectiveSummary": "string",
    "totalMinutes": 75,
    "segments": [
      {
        "title": "string",
        "type": "RECAP | MINI_LECTURE | DEMO | DISCUSSION | ACTIVITY | CHECK_FOR_UNDERSTANDING | WRAP_UP",
        "durationMinutes": 10,
        "objective": "string",
        "description": "string"
      }
    ]
  },
  "weeklyOutline": [
    {
      "weekNumber": 1,
      "theme": "string",
      "keyOutcomes": "string",
      "suggestedAssessment": "string"
    }
  ]
}
        `,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: LessonPlanResult;
    try {
      parsed = LessonPlanSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error("Lesson plan parse error:", err, "raw:", raw);
      parsed = {
        courseTitle,
        weekTopic,
        nextClass: {
          objectiveSummary: "Parsing failed or schema mismatch.",
          totalMinutes: duration,
          segments: [],
        },
        weeklyOutline: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Lesson plan generation failed" },
      { status: 500 }
    );
  }
}