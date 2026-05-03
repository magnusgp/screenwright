type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenAIMessage = {
  role: "system" | "user";
  content: string | OpenAIContentPart[];
};

type OpenAIRequest = {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
};

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function requestOpenAIChatCompletion(
  apiKey: string,
  request: OpenAIRequest
): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(request)
  });

  const data = (await response.json()) as OpenAIResponse;

  if (!response.ok) {
    const message = data.error?.message ?? `OpenAI request failed with ${response.status}`;
    throw new Error(message);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response missing content.");
  }

  return content;
}

export type { OpenAIContentPart, OpenAIMessage };
