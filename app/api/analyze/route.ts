import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type Question = {
  number: number;
  question: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
};

function extractJson(text: string): unknown {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI did not return valid JSON.");
  }

  const jsonText = cleaned.slice(first, last + 1);

  return JSON.parse(jsonText);
}

function getTextFromResponse(data: any): string {
  const message = data?.choices?.[0]?.message;

  if (!message) {
    return "";
  }

  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((item: any) => {
        if (typeof item === "string") return item;
        return item?.text || item?.content || "";
      })
      .join("\n");
  }

  if (typeof message.reasoning === "string") {
    return message.reasoning;
  }

  return "";
}

function normalizeQuestions(value: any): Question[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: any, index: number) => {
      const question =
        typeof item?.question === "string"
          ? item.question.trim()
          : "";

      if (!question) {
        return null;
      }

      const difficulty =
        item?.difficulty === "hard"
          ? "hard"
          : item?.difficulty === "medium"
            ? "medium"
            : "easy";

      return {
        number:
          typeof item?.number === "number"
            ? item.number
            : index + 1,
        question,
        topic:
          typeof item?.topic === "string"
            ? item.topic.trim()
            : "General",
        difficulty,
      };
    })
    .filter(Boolean) as Question[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "BODHA is not configured correctly. OPENROUTER_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const fileType =
      typeof body.fileType === "string"
        ? body.fileType
        : "";

    const fileName =
      typeof body.fileName === "string"
        ? body.fileName
        : "uploaded file";

    const image =
      typeof body.image === "string"
        ? body.image
        : typeof body.imageData === "string"
          ? body.imageData
          : "";

    const extractedText =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    /*
     * IMAGE MODE
     */
    if (image) {
      if (!image.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Invalid image format." },
          { status: 400 }
        );
      }

      if (image.length > 4_000_000) {
        return NextResponse.json(
          {
            error:
              "This image is too large. Please upload a smaller image.",
          },
          { status: 413 }
        );
      }
    }

    /*
     * TEXT / DOCUMENT MODE
     */
    if (!image && !extractedText) {
      return NextResponse.json(
        {
          error:
            "BODHA could not find readable content in this file.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are BODHA, a friendly learning mentor for children.

Your job is to READ educational material and identify the questions
or learning activities contained in it.

IMPORTANT:
- Do NOT solve the questions.
- Do NOT provide answers.
- Preserve the meaning of the original questions.
- Preserve blanks such as ______.
- Read diagrams or visual information when possible.
- Identify the likely subject.
- Identify the topic for each question.
- Estimate difficulty as easy, medium, or hard.
- Do not invent questions that are not present in the uploaded material.
- Return ONLY valid JSON.
- Do not use markdown.

Required JSON structure:

{
  "subject": "string",
  "questions": [
    {
      "number": 1,
      "question": "string",
      "topic": "string",
      "difficulty": "easy"
    }
  ]
}
`;

    const userText = `
Analyze this educational file.

File name: ${fileName}
File type: ${fileType || "unknown"}

Extract the questions and learning activities accurately.

${extractedText
  ? `Extracted file text:

${extractedText.slice(0, 120000)}`
  : "The uploaded material is an image. Read the image carefully."}
`;

    const content: any[] = [
      {
        type: "text",
        text: `${systemPrompt}\n\n${userText}`,
      },
    ];

    if (image) {
      content.push({
        type: "image_url",
        image_url: {
          url: image,
        },
      });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "BODHA.ai",
        "HTTP-Referer": "https://bodha.ai",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        provider: {
          allow_fallbacks: true,
        },
        messages: [
          {
            role: "user",
            content,
          },
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("OpenRouter analyze error:", responseText);

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "BODHA's AI service is temporarily busy. Please wait a moment and try again.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            "BODHA could not analyze this file right now.",
        },
        { status: 502 }
      );
    }

    let aiData: any;

    try {
      aiData = JSON.parse(responseText);
    } catch {
      console.error("Invalid OpenRouter response:", responseText);

      return NextResponse.json(
        {
          error: "BODHA received an invalid AI response.",
        },
        { status: 502 }
      );
    }

    const aiText = getTextFromResponse(aiData);

    if (!aiText) {
      return NextResponse.json(
        {
          error:
            "BODHA did not receive readable analysis from the AI.",
        },
        { status: 502 }
      );
    }

    let parsed: any;

    try {
      parsed = extractJson(aiText);
    } catch (error) {
      console.error("Analyzer JSON error:", error);
      console.error("AI output:", aiText);

      return NextResponse.json(
        {
          error:
            "BODHA understood the file but could not format the result correctly. Please try again.",
        },
        { status: 502 }
      );
    }

    const questions = normalizeQuestions(parsed?.questions);

    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "BODHA could not find any questions in this file.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      subject:
        typeof parsed?.subject === "string"
          ? parsed.subject.trim()
          : "General",
      questions,
      fileName,
      fileType,
    });
  } catch (error) {
    console.error("Analyze route error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while reading the file. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "BODHA analyzer",
  });
}