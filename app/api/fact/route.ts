import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/*
|--------------------------------------------------------------------------
| Reliable built-in facts
|--------------------------------------------------------------------------
|
| These are used as a safety net if the AI provider is temporarily
| unavailable or returns an incorrectly formatted response.
|
| They also guarantee that Learn a Fact never becomes a broken button.
|
*/

const BACKUP_FACTS = [
  {
    title: "A Day on Venus",
    fact: "Venus takes longer to rotate once on its axis than it takes to travel around the Sun.",
    whyItMatters:
      "This means that on Venus, one rotation is longer than one year!",
    category: "Space",
    emoji: "🪐",
  },
  {
    title: "Three Hearts",
    fact: "An octopus has three hearts.",
    whyItMatters:
      "Two hearts help move blood to the gills, while another pumps blood around the body.",
    category: "Animals",
    emoji: "🐙",
  },
  {
    title: "Bananas Are Berries",
    fact: "In botanical science, bananas are classified as berries.",
    whyItMatters:
      "Botanists classify fruits by how they develop, which can be very different from how we classify them in everyday life.",
    category: "Plants",
    emoji: "🍌",
  },
  {
    title: "The Moon Is Moving Away",
    fact: "The Moon is slowly moving farther away from Earth by about 3.8 centimetres each year.",
    whyItMatters:
      "The Moon and Earth are connected by gravity, and this tiny movement is part of how the Earth-Moon system changes over time.",
    category: "Space",
    emoji: "🌙",
  },
  {
    title: "Honey Can Last a Very Long Time",
    fact: "Properly stored honey can remain edible for a very long time because it has very little available water and is naturally acidic.",
    whyItMatters:
      "Its unusual chemistry makes it difficult for many microorganisms to grow in it.",
    category: "Science",
    emoji: "🍯",
  },
  {
    title: "Your Bones Are Alive",
    fact: "Bones are living tissues that are constantly being broken down and rebuilt by your body.",
    whyItMatters:
      "Your skeleton is not a completely fixed structure; your body continually maintains and repairs it.",
    category: "Human Body",
    emoji: "🦴",
  },
  {
    title: "Lightning Is Extremely Hot",
    fact: "The air in a lightning channel can become several times hotter than the surface of the Sun.",
    whyItMatters:
      "The sudden heating and expansion of air around lightning helps create the sound we hear as thunder.",
    category: "Weather",
    emoji: "⚡",
  },
  {
    title: "Trees Help Make Oxygen",
    fact: "Green plants release oxygen during photosynthesis when they use light energy to make food.",
    whyItMatters:
      "Photosynthesis is one of the important processes that supports life on Earth.",
    category: "Nature",
    emoji: "🌳",
  },
  {
    title: "The Pacific Ocean Is Huge",
    fact: "The Pacific Ocean is the largest ocean on Earth.",
    whyItMatters:
      "It covers more area than any other ocean and stretches between Asia, Australia, North America and South America.",
    category: "Geography",
    emoji: "🌊",
  },
  {
    title: "Some Bamboo Grows Very Fast",
    fact: "Some species of bamboo can grow more than 30 centimetres in a single day under suitable conditions.",
    whyItMatters:
      "Bamboo is one of the fastest-growing groups of plants in the world.",
    category: "Plants",
    emoji: "🎋",
  },
  {
    title: "A Blue Whale Is Enormous",
    fact: "The blue whale is the largest known animal to have ever lived on Earth.",
    whyItMatters:
      "Even though it lives in the ocean, it is a mammal that breathes air with lungs.",
    category: "Animals",
    emoji: "🐋",
  },
  {
    title: "Light Travels Very Fast",
    fact: "Light travels through empty space at about 300,000 kilometres per second.",
    whyItMatters:
      "That incredible speed allows sunlight to reach Earth in roughly eight minutes.",
    category: "Physics",
    emoji: "💡",
  },
  {
    title: "Earth Is Not a Perfect Sphere",
    fact: "Earth is slightly flattened at its poles and wider around its equator.",
    whyItMatters:
      "Earth's rotation causes its shape to differ slightly from a perfect sphere.",
    category: "Earth",
    emoji: "🌍",
  },
  {
    title: "Sharks Are Older Than Trees",
    fact: "Sharks existed millions of years before the first trees appeared on Earth.",
    whyItMatters:
      "This shows how ancient some groups of animals are compared with many plants we see today.",
    category: "History of Life",
    emoji: "🦈",
  },
  {
    title: "A Group of Flamingos",
    fact: "A group of flamingos is commonly called a flamboyance.",
    whyItMatters:
      "Many animals have special collective names, and flamingos have one of the most colourful ones!",
    category: "Animals",
    emoji: "🦩",
  },
  {
    title: "The Eiffel Tower Changes Height",
    fact: "The Eiffel Tower can become slightly taller during hot weather because its metal expands when heated.",
    whyItMatters:
      "It is a simple real-world example of thermal expansion.",
    category: "Science",
    emoji: "🗼",
  },
  {
    title: "Saturn Can Float",
    fact: "Saturn has an average density lower than water.",
    whyItMatters:
      "If there were a bathtub enormous enough to hold Saturn, the planet would theoretically float in it.",
    category: "Space",
    emoji: "🪐",
  },
  {
    title: "Your Heart Beats Thousands of Times",
    fact: "A human heart normally beats around 100,000 times in a day, although the exact number varies from person to person.",
    whyItMatters:
      "Your heart works continuously to move blood around your body.",
    category: "Human Body",
    emoji: "❤️",
  },
  {
    title: "Penguins Cannot Fly",
    fact: "Penguins are birds, but their wings have evolved into flipper-like structures that help them swim instead of fly.",
    whyItMatters:
      "Evolution can shape the bodies of animals for the environment in which they live.",
    category: "Animals",
    emoji: "🐧",
  },
  {
    title: "The Sahara Was Greener",
    fact: "Parts of the Sahara Desert were much greener thousands of years ago than they are today.",
    whyItMatters:
      "Earth's climate and environments can change dramatically over long periods of time.",
    category: "Earth",
    emoji: "🏜️",
  },
  {
    title: "Jupiter Has Many Moons",
    fact: "Jupiter has many natural satellites, including the four large moons discovered by Galileo Galilei in 1610.",
    whyItMatters:
      "Those four moons helped provide important evidence that not everything in the sky revolves around Earth.",
    category: "Space",
    emoji: "🔭",
  },
  {
    title: "Water Can Exist in Three States",
    fact: "Water can naturally exist as a solid, liquid, or gas.",
    whyItMatters:
      "Ice, liquid water, and water vapour are all made from the same substance.",
    category: "Science",
    emoji: "💧",
  },
  {
    title: "The Human Brain Uses Energy",
    fact: "Although the human brain is only a small part of the body's mass, it uses a significant amount of the body's energy.",
    whyItMatters:
      "Thinking, sensing, remembering and controlling the body all require energy.",
    category: "Human Body",
    emoji: "🧠",
  },
  {
    title: "Cheetahs Are Fast",
    fact: "Cheetahs can reach speeds of around 100 kilometres per hour for short bursts.",
    whyItMatters:
      "Their flexible spine, long legs and specialized muscles help them accelerate quickly.",
    category: "Animals",
    emoji: "🐆",
  },
  {
    title: "Ants Are Strong for Their Size",
    fact: "Many ants can carry objects that are several times heavier than their own bodies.",
    whyItMatters:
      "Their small size and body structure give them impressive strength relative to their weight.",
    category: "Animals",
    emoji: "🐜",
  },
  {
    title: "Earth Has One Natural Satellite",
    fact: "The Moon is Earth's only natural satellite.",
    whyItMatters:
      "The Moon affects ocean tides and has been an important part of human observation of the night sky.",
    category: "Space",
    emoji: "🌙",
  },
  {
    title: "Sound Needs a Medium",
    fact: "Sound needs a material such as air, water or a solid to travel through.",
    whyItMatters:
      "That is why sound cannot travel through the empty vacuum of space the way light can.",
    category: "Physics",
    emoji: "🔊",
  },
  {
    title: "Spiders Are Not Insects",
    fact: "Spiders are arachnids, not insects.",
    whyItMatters:
      "Adult insects generally have six legs, while spiders have eight.",
    category: "Animals",
    emoji: "🕷️",
  },
  {
    title: "The Sun Is a Star",
    fact: "The Sun is a star located at the centre of our solar system.",
    whyItMatters:
      "Its light and heat provide most of the energy that drives life and weather on Earth.",
    category: "Space",
    emoji: "☀️",
  },
  {
    title: "Plants Have Tiny Factories",
    fact: "Plant cells contain structures called chloroplasts where photosynthesis takes place.",
    whyItMatters:
      "These tiny structures help plants convert light energy into chemical energy.",
    category: "Biology",
    emoji: "🌿",
  },
];

/* -------------------------------------------------------
   TEXT EXTRACTION
------------------------------------------------------- */

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

  if (
    typeof message.content ===
    "object" &&
    message.content !== null
  ) {
    return JSON.stringify(
      message.content
    );
  }

  if (
    typeof message.reasoning ===
    "string"
  ) {
    return message.reasoning.trim();
  }

  return "";
}

/* -------------------------------------------------------
   JSON EXTRACTION
------------------------------------------------------- */

function extractJson(
  text: string
): any | null {
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

  try {
    return JSON.parse(
      cleaned
    );
  } catch {}

  const first =
    cleaned.indexOf("{");

  const last =
    cleaned.lastIndexOf("}");

  if (
    first === -1 ||
    last === -1 ||
    last <= first
  ) {
    return null;
  }

  try {
    return JSON.parse(
      cleaned.slice(
        first,
        last + 1
      )
    );
  } catch {
    return null;
  }
}

/* -------------------------------------------------------
   NORMALIZE
------------------------------------------------------- */

function normalize(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim();
}

/* -------------------------------------------------------
   PICK A BACKUP FACT
------------------------------------------------------- */

function getBackupFact(
  excluded: string[]
) {
  const excludedSet =
    new Set(
      excluded.map(
        normalize
      )
    );

  const available =
    BACKUP_FACTS.filter(
      (item) =>
        !excludedSet.has(
          normalize(
            item.fact
          )
        )
    );

  if (
    available.length > 0
  ) {
    return available[
      Math.floor(
        Math.random() *
          available.length
      )
    ];
  }

  /*
   * If all built-in facts have been
   * seen, restart the pool.
   *
   * AI facts are still tracked separately.
   */
  return BACKUP_FACTS[
    Math.floor(
      Math.random() *
        BACKUP_FACTS.length
    )
  ];
}

/* -------------------------------------------------------
   VALIDATE AI FACT
------------------------------------------------------- */

function validFact(
  value: any
): value is {
  title: string;
  fact: string;
  whyItMatters: string;
  category: string;
  emoji: string;
} {
  return (
    value &&
    typeof value ===
      "object" &&
    typeof value.title ===
      "string" &&
    typeof value.fact ===
      "string" &&
    typeof value.whyItMatters ===
      "string" &&
    value.fact.trim()
      .length > 15
  );
}

/* -------------------------------------------------------
   POST
------------------------------------------------------- */

export async function POST(
  request: NextRequest
) {
  let body: any = {};

  try {
    body =
      await request.json();
  } catch {
    body = {};
  }

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

  const excluded =
    Array.isArray(
      body?.exclude
    )
      ? body.exclude
          .filter(
            (item: any) =>
              typeof item ===
              "string"
          )
          .slice(-100)
      : [];

  /*
   * ------------------------------------------------------
   * Try AI first.
   * ------------------------------------------------------
   */

  const apiKey =
    process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const previousFacts =
        excluded.length > 0
          ? excluded
              .map(
                (
                  item: string,
                  index: number
                ) =>
                  `${index + 1}. ${item}`
              )
              .join("\n")
          : "No facts have been shown yet.";

      const prompt = `
You are BODHA, a friendly general-knowledge mentor for children.

Create ONE interesting and TRUE real-world fact for a Class ${classLevel} child.

The child is named ${name}.

Choose from subjects such as:
space, animals, science, nature, Earth, oceans,
geography, inventions, history, technology,
mathematics, human body, plants and everyday science.

IMPORTANT RULES:

1. The fact must be genuinely true.
2. Use well-established information.
3. Do not invent statistics.
4. Do not discuss politics.
5. Do not discuss adult subjects.
6. Do not repeat a previous fact.
7. Make it exciting for a child.
8. Keep the explanation simple.
9. Return ONLY one JSON object.
10. Do not use markdown.

Return exactly this structure:

{
  "title": "Short interesting title",
  "fact": "The real-world fact",
  "whyItMatters": "Why this fact is interesting",
  "category": "Science",
  "emoji": "🔬"
}

Previously shown facts:
${previousFacts}

Create ONE completely different fact.
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
                    prompt,
                },
                {
                  role:
                    "user",
                  content:
                    "Give me one amazing new fact.",
                },
              ],

              temperature:
                0.9,

              max_tokens:
                600,
            }),
          }
        );

      const raw =
        await response.text();

      if (response.ok) {
        try {
          const data =
            JSON.parse(
              raw
            );

          const aiText =
            extractText(data);

          const parsed =
            extractJson(
              aiText
            );

          if (
            validFact(parsed)
          ) {
            const aiFact = {
              title:
                parsed.title.trim(),

              fact:
                parsed.fact.trim(),

              whyItMatters:
                parsed.whyItMatters.trim(),

              category:
                typeof parsed.category ===
                "string"
                  ? parsed.category.trim()
                  : "World",

              emoji:
                typeof parsed.emoji ===
                "string"
                  ? parsed.emoji.trim()
                  : "🌍",
            };

            /*
             * Do not return an AI fact if it
             * accidentally repeats something
             * already shown.
             */
            const duplicate =
              excluded.some(
                (
                  oldFact: string
                ) =>
                  normalize(
                    oldFact
                  ) ===
                  normalize(
                    aiFact.fact
                  )
              );

            if (!duplicate) {
              return NextResponse.json(
                {
                  fact:
                    aiFact,
                  source:
                    "ai",
                }
              );
            }
          }
        } catch (error) {
          console.warn(
            "AI fact parsing failed. Using backup fact.",
            error
          );
        }
      } else {
        console.warn(
          "AI fact request failed:",
          response.status,
          raw
        );
      }
    } catch (error) {
      console.warn(
        "AI fact request failed. Using backup fact.",
        error
      );
    }
  }

  /*
   * ------------------------------------------------------
   * RELIABLE FALLBACK
   * ------------------------------------------------------
   *
   * Even if OpenRouter is busy, rate-limited,
   * unavailable, or returns malformed JSON,
   * Learn a Fact still works.
   */

  const backup =
    getBackupFact(
      excluded
    );

  return NextResponse.json({
    fact: backup,
    source: "backup",
  });
}

/* -------------------------------------------------------
   GET
------------------------------------------------------- */

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service:
      "BODHA Learn a Fact",
    backupFacts:
      BACKUP_FACTS.length,
  });
}