import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 30000,
});

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "BODHA worksheet analyser is working!",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const image = body?.image;

    if (!image) {
      return NextResponse.json(
        {
          error:
            "No worksheet image received.",
        },
        { status: 400 }
      );
    }

    console.log(
      "🌱 BODHA: Reading worksheet..."
    );

    const completion =
      await openai.chat.completions.create({
        model:
          "google/gemma-4-26b-a4b-it:free",

        temperature: 0.1,

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",

            content: `
You are BODHA's worksheet analyser.

You are looking at a worksheet image for a school child.

Your job is to carefully read the image and extract every clearly visible QUESTION.

Return ONLY valid JSON.

Use exactly this structure:

{
  "subject": "Mathematics",
  "questions": [
    {
      "number": 1,
      "question": "Question text",
      "topic": "Topic",
      "difficulty": "Easy"
    }
  ]
}

IMPORTANT RULES:

1. Read the image carefully.
2. Extract EVERY clearly visible question.
3. Do NOT invent questions.
4. Do NOT guess text that cannot be seen.
5. Preserve the original meaning of each question.
6. Include answer choices when they are visible.
7. Ignore logos.
8. Ignore website addresses.
9. Ignore page numbers.
10. Ignore decorative text.
11. Do not treat headings as questions.
12. Do not treat general instructions as questions.
13. Number questions from 1 onwards.
14. Identify the most appropriate school subject.
15. Give each question a useful topic.
16. Difficulty must be exactly one of:
    Easy
    Medium
    Hard
17. Return JSON only.
`,
          },

          {
            role: "user",

            content: [
              {
                type: "text",
                text:
                  "Read this worksheet carefully and extract all visible questions.",
              },

              {
                type: "image_url",

                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
      });

    const raw =
      completion.choices[0]?.message?.content ||
      "";

    if (!raw) {
      throw new Error(
        "The worksheet analyser returned an empty response."
      );
    }

    let cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error(
        "The worksheet analyser returned invalid JSON."
      );
    }

    cleaned = cleaned.substring(
      start,
      end + 1
    );

    const parsed = JSON.parse(cleaned);

    if (
      !parsed ||
      !Array.isArray(parsed.questions)
    ) {
      throw new Error(
        "No questions were found on the worksheet."
      );
    }

    const questions = parsed.questions
      .filter(
        (question: any) =>
          question &&
          typeof question.question ===
            "string" &&
          question.question.trim()
      )
      .map(
        (question: any, index: number) => ({
          number: index + 1,

          question:
            question.question.trim(),

          topic:
            question.topic ||
            "General Practice",

          difficulty:
            ["Easy", "Medium", "Hard"].includes(
              question.difficulty
            )
              ? question.difficulty
              : "Medium",
        })
      );

    if (!questions.length) {
      throw new Error(
        "BODHA could not find any questions."
      );
    }

    console.log(
      `✅ BODHA found ${questions.length} questions`
    );

    return NextResponse.json({
      subject:
        parsed.subject ||
        "General",

      questions,
    });
  } catch (error: any) {
    console.error(
      "❌ BODHA ANALYSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "BODHA could not read this worksheet.",
      },
      { status: 500 }
    );
  }
}