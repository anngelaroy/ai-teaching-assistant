import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int(),
  explanation: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const QuizSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  questions: z.array(QuizQuestionSchema),
});

type QuizResult = z.infer<typeof QuizSchema>;

export async function POST(req: Request) {
  try {
    const { topic, difficulty, numQuestions } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return NextResponse.json(
        { error: "difficulty must be EASY, MEDIUM, or HARD" },
        { status: 400 }
      );
    }

    const count = Math.max(1, Math.min(Number(numQuestions) || 5, 20));

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI teaching assistant that creates high-quality quizzes for university courses. " +
            "You must output valid JSON only.",
        },
        {
          role: "user",
          content: `
Create a multiple-choice quiz.

CONTEXT:
- Course topic: ${topic}
- Target difficulty: ${difficulty} (EASY, MEDIUM, or HARD)
- Number of questions: ${count}

REQUIREMENTS:
- Each question must be conceptually clear and unambiguous.
- Provide 4 options per question when possible.
- Only ONE option should be clearly correct.
- Explanations must briefly justify why the correct answer is correct.
- Use language suitable for university students.
- Do NOT include question numbering in the text.

Return ONLY valid JSON in this exact format:
{
  "topic": "string",
  "difficulty": "EASY | MEDIUM | HARD",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string",
      "difficulty": "EASY | MEDIUM | HARD"
    }
  ]
}
        `,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: QuizResult;
    try {
      parsed = QuizSchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error("Quiz parse error:", err, "raw:", raw);
      parsed = {
        topic,
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
        questions: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Quiz generation failed" },
      { status: 500 }
    );
  }
}