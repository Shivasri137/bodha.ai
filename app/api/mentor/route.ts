import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

function extractText(data: any): string {
  const message =
    data?.choices?.[0]?.message;

  if (!message) {
    return "";
  }

  if (
    typeof message.content === "string"
  ) {
    return message.content.trim();
  }

  if (
    Array.isArray(message.content)
  ) {
    return message.content
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.text ||
          item?.content ||
          ""
        );
      })
      .join("\n")
      .trim();
  }

  return "";
}

function extractJson(text: string): any {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start =
    cleaned.indexOf("{");

  const end =
    cleaned.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    throw new Error(
      "AI returned invalid JSON."
    );
  }

  return JSON.parse(
    cleaned.slice(start, end + 1)
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OPENROUTER_API_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const body =
      await request.json();

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "Learner";

    const classLevel =
      typeof body?.classLevel ===
      "string"
        ? body.classLevel.trim()
        : "primary school";

    const goal =
      typeof body?.goal === "string"
        ? body.goal.trim()
        : "School Practice";

    const question =
      typeof body?.question ===
      "string"
        ? body.question.trim()
        : "";

    const childAnswer =
      typeof body?.childAnswer ===
      "string"
        ? body.childAnswer.trim()
        : typeof body?.answer ===
            "string"
          ? body.answer.trim()
          : "";

    const correctAnswer =
      typeof body?.correctAnswer ===
      "string"
        ? body.correctAnswer.trim()
        : "";

    const topic =
      typeof body?.topic === "string"
        ? body.topic.trim()
        : "General";

    const attempt =
      typeof body?.attempt ===
      "number"
        ? body.attempt
        : 1;

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Question is required.",
        },
        { status: 400 }
      );
    }

    if (!childAnswer) {
      return NextResponse.json(
        {
          error:
            "Please enter an answer first.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are BODHA, a kind and patient learning mentor for children.

Student:
Name: ${name}
Class: ${classLevel}
Goal: ${goal}
Topic: ${topic}
Attempt number: ${attempt}

Your purpose is to help the child THINK.

IMPORTANT RULES:

1. Determine whether the child's answer is correct.
2. Return the result as JSON.
3. If the answer is correct:
   - isCorrect must be true.
   - Celebrate briefly.
   - Explain why it is correct in simple language.
4. If the answer is incorrect:
   - isCorrect must be false.
   - Do NOT reveal the correct answer immediately.
   - Give ONE small useful hint.
   - Encourage the child to edit their answer.
5. Never shame the child.
6. Never say the child is stupid, lazy, bad, or similar.
7. Use language appropriate for the child's class.
8. Keep the response short and friendly.
9. If a correct answer is provided, use it for correctness checking.
10. If no correct answer is provided, reason carefully from the question.
11. Do not invent unrelated information.

Return ONLY JSON in this exact structure:

{
  "isCorrect": true,
  "response": "Short child-friendly response."
}
`;

    const userPrompt = `
Question:
${question}

Child's answer:
${childAnswer}

Known correct answer:
${correctAnswer || "Not provided"}

Evaluate the child's answer and help them learn.
`;

    const response =
      await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
          "X-Title":
            "BODHA.ai",
          "HTTP-Referer":
            "https://bodha.ai",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          provider: {
            allow_fallbacks: true,
          },
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

    const raw =
      await response.text();

    if (!response.ok) {
      console.error(
        "BODHA mentor API error:",
        raw
      );

      if (
        response.status === 429
      ) {
        return NextResponse.json(
          {
            error:
              "BODHA is a little busy right now. Please try again in a moment.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            "BODHA could not check the answer right now.",
        },
        { status: 502 }
      );
    }

    let data: any;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error(
        "Invalid OpenRouter response:",
        raw
      );

      return NextResponse.json(
        {
          error:
            "BODHA received an invalid AI response.",
        },
        { status: 502 }
      );
    }

    const aiText =
      extractText(data);

    if (!aiText) {
      return NextResponse.json(
        {
          error:
            "BODHA did not receive an answer.",
        },
        { status: 502 }
      );
    }

    let result: any;

    try {
      result =
        extractJson(aiText);
    } catch (error) {
      console.error(
        "Mentor JSON parsing error:",
        error
      );

      console.error(
        "AI output:",
        aiText
      );

      /*
       * Graceful fallback.
       *
       * If the AI doesn't follow JSON,
       * don't unlock Next Question.
       */
      return NextResponse.json({
        isCorrect: false,
        response:
          "🌱 I'm not completely sure yet. Please try your answer once more and let's think together!",
      });
    }

    const isCorrect =
      result?.isCorrect === true;

    const mentorResponse =
      typeof result?.response ===
      "string"
        ? result.response.trim()
        : isCorrect
          ? "🎉 That's correct! Great thinking!"
          : "🌱 Good try! Think about the question and try again.";

    return NextResponse.json({
      isCorrect,
      response:
        mentorResponse,
    });
  } catch (error) {
    console.error(
      "BODHA mentor route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while checking your answer.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "BODHA mentor",
  });
}