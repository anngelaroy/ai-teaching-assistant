import { NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";
import JSZip from "jszip";
import pdfParse from "pdf-parse";

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

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith(".pptx") || name.endsWith(".ppt")) {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((f) => /ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort();

    let text = "";
    for (const slideName of slideFiles) {
      const xml = await zip.files[slideName].async("string");
      text +=
        xml
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim() + "\n";
    }
    return text;
  }

  // Fallback for plain text files
  return file.text();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const topic = (formData.get("topic") as string) || "Class material";
    const difficulty =
      (formData.get("difficulty") as "EASY" | "MEDIUM" | "HARD") || "MEDIUM";
    const numQuestionsRaw = formData.get("numQuestions") as string | null;
    const numQuestions = Math.max(
      1,
      Math.min(Number(numQuestionsRaw) || 5, 20)
    );

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const allowedExtensions = [".pdf", ".ppt", ".pptx", ".txt"];
    const hasAllowedExt = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (!hasAllowedExt) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, PPT, PPTX, or TXT file.",
        },
        { status: 400 }
      );
    }

    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(file);
    } catch (err) {
      console.error("File extraction error:", err);
      return NextResponse.json(
        { error: "Could not read file. Make sure it is a valid PDF or PPTX." },
        { status: 422 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No readable text found in the uploaded file." },
        { status: 422 }
      );
    }

    const truncatedContent =
      extractedText.length > 40_000
        ? extractedText.slice(0, 40_000)
        : extractedText;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI teaching assistant that builds quizzes from uploaded class materials (PPT/PPTX/PDF). " +
            "You must output valid JSON only.",
        },
        {
          role: "user",
          content: `
You are given extracted text content from a university class file.

TOPIC HINT (provided by instructor):
${topic}

TARGET DIFFICULTY:
${difficulty} (EASY, MEDIUM, or HARD)

NUMBER OF QUESTIONS TO GENERATE:
${numQuestions}

EXTRACTED FILE CONTENT:
----------------- START OF FILE -----------------
${truncatedContent}
------------------ END OF FILE ------------------

TASK:
- Infer the main learning objectives from the text.
- Create ${numQuestions} multiple-choice questions that test key concepts.
- Each question should:
  - Be clearly worded and unambiguous.
  - Have 4 options when possible.
  - Have exactly ONE clearly correct answer.
  - Include a brief explanation referencing the underlying concepts.
  - Include a difficulty tag: "EASY", "MEDIUM", or "HARD".

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
      console.error("File quiz parse error:", err, "raw:", raw);
      parsed = {
        topic,
        difficulty,
        questions: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Quiz generation from file failed" },
      { status: 500 }
    );
  }
}