const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function askOpenRouter({
  messages,
  temperature = 0.7,
  maxTokens = 1000,
}: {
  messages: any[];
  temperature?: number;
  maxTokens?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is missing.");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",

      // Prevent OpenRouter response caching.
      "X-OpenRouter-Cache": "false",

      "HTTP-Referer": "https://bodha.ai",
      "X-Title": "BODHA.ai",
    },

    body: JSON.stringify({
      // Let OpenRouter choose an available free model.
      model: "openrouter/free",

      messages,

      temperature,

      max_tokens: maxTokens,

      // If one model/provider is unavailable,
      // OpenRouter can try another available model.
      route: "fallback",
    }),
  });

  const text = await response.text();

  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `OpenRouter returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `OpenRouter request failed (${response.status}).`;

    throw new Error(`OpenRouter error ${response.status}: ${message}`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned an empty AI response.");
  }

  return content;
}