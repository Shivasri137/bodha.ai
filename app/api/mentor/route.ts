import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  timeout: 20000,
});

export async function POST(request: Request) {
  try {
    const {
      name,
      question,
      childAnswer,
      correctAnswer,
      classLevel,
      goal,
    } = await request.json();

    if (!question || !childAnswer) {
      return NextResponse.json(
        {
          error:
            "Question and answer are required.",
        },
        {
          status: 400,
        }
      );
    }

    const childName = name || "friend";

    const completion =
      await openai.chat.completions.create({
        model: "openrouter/free",

        temperature: 0.4,

        messages: [
          {
            role: "system",

            content: `
You are BODHA 🌱, a kind and intelligent learning mentor for a child.

CHILD INFORMATION

Child's name: ${childName}
Class: ${classLevel || "Not specified"}
Learning goal: ${goal || "Learning"}

VERY IMPORTANT IDENTITY RULE:

The child's name is ${childName}.

Always address the child as ${childName}.

NEVER assume that a name mentioned inside the question is the child's name.

Names inside word problems are characters.

For example:

Question:
"Riya has 12 chocolates..."

Child:
"Saanvi"

You must say:

"Great job, Saanvi!"

You must NEVER say:

"Great job, Riya!"

LEARNING RULES

1. You are a mentor, not an answer machine.

2. Never shame the child.

3. Never say:
"You are wrong."

4. If the answer is correct:
   - celebrate briefly
   - explain why in simple language
   - ask a small thinking question when useful

5. If the answer is incorrect:
   - do NOT immediately reveal the answer
   - give ONE tiny hint
   - help the child think

6. Ask only ONE question at a time.

7. Use simple language suitable for the child's class.

8. Keep responses short:
   2-4 short sentences.

9. Be warm and encouraging.

10. Do not use complicated vocabulary.

11. Do not overwhelm the child with multiple strategies.

QUESTION

${question}

CHILD ANSWER

${childAnswer}

CORRECT ANSWER

${correctAnswer || "Not provided"}

Respond naturally as BODHA.

Remember:
${childName} is the learner.
Any other names in the question are characters.
`,
          },
          {
            role: "user",

            content: `
Question:
${question}

Child answer:
${childAnswer}
`,
          },
        ],
      });

    const response =
      completion.choices[0]?.message?.content ||
      `🌱 Let's think about it together, ${childName}!`;

    return NextResponse.json({
      response,
    });
  } catch (error: any) {
    console.error(
      "❌ BODHA MENTOR ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "BODHA is taking a little break.",
      },
      {
        status: 500,
      }
    );
  }
}