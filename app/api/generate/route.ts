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
    typeof message.content ===
    "string"
  ) {
    return message.content.trim();
  }

  if (
    Array.isArray(
      message.content
    )
  ) {
    return message.content
      .map((item: any) => {
        if (
          typeof item ===
          "string"
        ) {
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

function extractJson(
  text: string
): any {
  let cleaned =
    text.trim();

  cleaned = cleaned
    .replace(
      /^```json\s*/i,
      ""
    )
    .replace(
      /^```\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .trim();

  const first =
    cleaned.indexOf("{");

  const last =
    cleaned.lastIndexOf("}");

  if (
    first === -1 ||
    last === -1 ||
    last <= first
  ) {
    throw new Error(
      "AI did not return valid JSON."
    );
  }

  return JSON.parse(
    cleaned.slice(
      first,
      last + 1
    )
  );
}

function cleanQuestions(
  value: any
) {
  if (
    !Array.isArray(value)
  ) {
    return [];
  }

  return value
    .map(
      (
        item: any,
        index: number
      ) => ({
        id:
          typeof item?.id ===
          "string"
            ? item.id
            : `${Date.now()}-${index}`,

        question:
          typeof item?.question ===
          "string"
            ? item.question.trim()
            : "",

        topic:
          typeof item?.topic ===
          "string"
            ? item.topic.trim()
            : "General",

        difficulty:
          item?.difficulty ===
          "Hard"
            ? "Hard"
            : item?.difficulty ===
                "Medium"
              ? "Medium"
              : "Easy",

        correctAnswer:
          typeof item?.correctAnswer ===
          "string"
            ? item.correctAnswer.trim()
            : "",

        hint:
          typeof item?.hint ===
          "string"
            ? item.hint.trim()
            : "",
      })
    )
    .filter(
      (item) =>
        item.question.length >
        0
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
      typeof body?.name ===
      "string"
        ? body.name.trim()
        : "Learner";

    const classLevel =
      typeof body?.classLevel ===
      "string"
        ? body.classLevel.trim()
        : "2";

    const goal =
      typeof body?.goal ===
      "string"
        ? body.goal.trim()
        : "School Practice";

    const type =
      typeof body?.type ===
      "string"
        ? body.type
        : "challenge";

    const count =
      Math.min(
        Math.max(
          Number(body?.count) ||
            5,
          3
        ),
        8
      );

    const exclude =
      Array.isArray(
        body?.exclude
      )
        ? body.exclude
            .filter(
              (item: any) =>
                typeof item ===
                "string"
            )
            .slice(-60)
        : [];

    const exclusionText =
      exclude.length > 0
        ? exclude
            .map(
              (
                question: string,
                index: number
              ) =>
                `${index + 1}. ${question}`
            )
            .join("\n")
        : "There are no previously used questions.";

    let activityInstruction =
      "";

    if (
      type ===
      "olympiad"
    ) {
      activityInstruction = `
Create reasoning-focused Olympiad-style questions.
Use puzzles, patterns, logic, number reasoning, shapes,
comparisons, sequences, and age-appropriate problem solving.
Do not make them unnecessarily difficult.
`;
    } else if (
      type ===
      "homework"
    ) {
      activityInstruction = `
Create school-style practice questions.
Cover appropriate curriculum concepts for the child's class.
Use different question styles and real-life examples.
`;
    } else {
      activityInstruction = `
Create one small, fun daily challenge style set.
Use interesting real-life situations, puzzles, patterns,
math, science, language, and reasoning.
The questions should feel playful rather than repetitive.
`;
    }

    const systemPrompt = `
You are BODHA, an intelligent learning mentor for children.

Student name: ${name}
Class: ${classLevel}
Goal: ${goal}

Generate ${count} completely NEW questions.

${activityInstruction}

VERY IMPORTANT:
- Every question must be different from the others.
- Do not repeat any previously used question.
- Do not merely change the numbers of an old question.
- Change the scenario, wording, concept or reasoning approach.
- Match the child's class level.
- Keep questions child-friendly.
- Make the set varied.
- Do not use questions about politics, violence, adult topics,
  dangerous activities, or inappropriate content.
- Do not give explanations outside the JSON.
- Return ONLY valid JSON.

Each question must have:
- question
- topic
- difficulty
- correctAnswer
- hint

Use this exact structure:

{
  "questions": [
    {
      "id": "unique-id",
      "question": "Question text",
      "topic": "Topic",
      "difficulty": "Easy",
      "correctAnswer": "Answer",
      "hint": "Small helpful hint"
    }
  ]
}

PREVIOUSLY USED QUESTIONS:
${exclusionText}

None of those questions may appear again.
`;

    const response =
      await fetch(
        OPENROUTER_URL,
        {
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
            model:
              "openrouter/free",

            provider: {
              allow_fallbacks:
                true,
            },

            messages: [
              {
                role:
                  "system",
                content:
                  systemPrompt,
              },
              {
                role:
                  "user",
                content:
                  `Create ${count} fresh questions for Class ${classLevel}.`,
              },
            ],

            temperature:
              0.9,

            max_tokens:
              2500,
          }),
        }
      );

    const raw =
      await response.text();

    if (!response.ok) {
      console.error(
        "Generate API error:",
        raw
      );

      if (
        response.status ===
        429
      ) {
        return NextResponse.json(
          {
            error:
              "BODHA's AI service is busy right now. Please wait a moment and try again.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            "BODHA could not create fresh questions right now.",
        },
        { status: 502 }
      );
    }

    let data: any;

    try {
      data =
        JSON.parse(raw);
    } catch {
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
            "BODHA received an empty AI response.",
        },
        { status: 502 }
      );
    }

    let parsed: any;

    try {
      parsed =
        extractJson(aiText);
    } catch (error) {
      console.error(
        "Question JSON error:",
        error
      );

      console.error(
        "AI output:",
        aiText
      );

      return NextResponse.json(
        {
          error:
            "BODHA could not format the new questions correctly. Please try again.",
        },
        { status: 502 }
      );
    }

    const questions =
      cleanQuestions(
        parsed?.questions
      );

    if (
      questions.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "BODHA could not create any new questions.",
        },
        { status: 422 }
      );
    }

    /*
     * SERVER-SIDE duplicate protection.
     */
    const excludedNormalized =
      new Set(
        exclude.map(
          (item: string) =>
            item
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                " "
              )
              .trim()
        )
      );

    const seen =
      new Set<string>();

    const unique =
      questions.filter(
        (question: any) => {
          const key =
            question.question
              .toLowerCase()
              .replace(
                /[^a-z0-9]+/g,
                " "
              )
              .trim();

          if (
            excludedNormalized.has(
              key
            )
          ) {
            return false;
          }

          if (
            seen.has(key)
          ) {
            return false;
          }

          seen.add(key);

          return true;
        }
      );

    if (
      unique.length ===
      0
    ) {
      return NextResponse.json(
        {
          error:
            "BODHA generated only repeated questions. Please try again for a fresh set.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      questions:
        unique.slice(
          0,
          count
        ),
    });
  } catch (error) {
    console.error(
      "Generate route error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating fresh questions.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service:
      "BODHA dynamic question generator",
  });
}