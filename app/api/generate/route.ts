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
    message: "BODHA question generator is working!",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      classLevel,
      goal,
      progress,
      previousQuestion,
      previousAnswer,
      previousCorrectAnswer,
      previousTopic,
      previousDifficulty,
    } = body;

    if (!classLevel) {
      return NextResponse.json(
        {
          error: "Class level is required.",
        },
        { status: 400 }
      );
    }

    const childName = name || "friend";
    const childGoal = goal || "School Practice";

    const progressData = progress || {
      solved: 0,
      correct: 0,
      mistakes: 0,
      topics: {},
    };

    const prompt = `
You are BODHA 🌱, an intelligent learning-question generator for children.

You are NOT a random question generator.

Your job is to create the NEXT appropriate question for a child based on:
- their class
- their learning goal
- their previous performance
- topics they are strong at
- topics they need to practise
- their previous answer

CHILD PROFILE

Name: ${childName}
Class: ${classLevel}
Goal: ${childGoal}

LEARNING HISTORY

${JSON.stringify(progressData, null, 2)}

PREVIOUS QUESTION

${previousQuestion || "This is the first question of the session."}

PREVIOUS CHILD ANSWER

${previousAnswer || "No previous answer."}

PREVIOUS CORRECT ANSWER

${previousCorrectAnswer || "Not available."}

PREVIOUS TOPIC

${previousTopic || "None."}

PREVIOUS DIFFICULTY

${previousDifficulty || "None."}


IMPORTANT RULES

1. Generate ONE question only.

2. The question must be appropriate for Class ${classLevel}.

3. The question must match the child's goal:
   - Homework → school-style practice
   - Olympiad → reasoning, patterns, logic and problem solving
   - School Practice → curriculum-style practice
   - Just Explore → interesting educational questions

4. Do NOT repeat the previous question.

5. Do NOT create a question that is nearly identical to the previous question.

6. If the child made a mistake:
   - Give another question that helps practise the same concept.
   - Start slightly easier if needed.
   - Do not make it frustrating.

7. If the child answered correctly:
   - You may increase difficulty slightly.
   - You may introduce a related concept.

8. Use the child's history to target weak topics.

9. Avoid repeatedly asking the same topic when the child is already very strong unless increasing difficulty.

10. The question must have ONE clear answer.

11. The correct answer must be accurate.

12. Never use the child's name as the character in the question.
    The child is ${childName}.
    Names such as Riya, Rahul, Arjun, etc. inside a word problem are fictional characters.

13. Keep questions suitable for children.

14. For younger children, prefer concrete situations, objects, numbers and simple language.

15. For Olympiad questions, focus on THINKING rather than difficult calculations.

16. Do not reveal the answer inside the question.

17. Do not provide a solution.

18. Return ONLY valid JSON.

RETURN EXACTLY THIS STRUCTURE:

{
  "question": "The question text",
  "topic": "Topic name",
  "difficulty": "Easy",
  "correctAnswer": "Answer",
  "hint": "A very small hint that can help the mentor if needed",
  "reasoningSkill": "The skill being practised"
}

Difficulty must be exactly:
Easy
Medium
Hard
`;

    const completion =
      await openai.chat.completions.create({
        model: "openrouter/free",

        temperature: 0.8,

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content:
              `Generate the next question for ${childName}.`,
          },
        ],
      });

    const raw =
      completion.choices[0]?.message?.content || "";

    if (!raw) {
      throw new Error(
        "BODHA question generator returned an empty response."
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
        "BODHA question generator returned invalid JSON."
      );
    }

    cleaned = cleaned.substring(start, end + 1);

    const parsed = JSON.parse(cleaned);

    if (
      !parsed.question ||
      !parsed.topic ||
      !parsed.correctAnswer
    ) {
      throw new Error(
        "BODHA generated an incomplete question."
      );
    }

    const difficulty =
      ["Easy", "Medium", "Hard"].includes(
        parsed.difficulty
      )
        ? parsed.difficulty
        : "Easy";

    return NextResponse.json({
      question: {
        number: 1,
        question: parsed.question,
        topic: parsed.topic,
        difficulty,
        correctAnswer: String(
          parsed.correctAnswer
        ),
        hint: parsed.hint || "",
        reasoningSkill:
          parsed.reasoningSkill || "",
      },
    });
  } catch (error: any) {
    console.error(
      "❌ BODHA GENERATOR ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "BODHA could not create a new question.",
      },
      {
        status: 500,
      }
    );
  }
}