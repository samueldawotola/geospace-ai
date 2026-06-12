import OpenAI from "openai";

const openai = new OpenAI();

export async function generateTripContent(destination: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-5.4-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful travel assistant. Write a short, vivid description of a destination in 2-3 sentences.",
      },
      {
        role: "user",
        content: `Tell me about visiting ${destination}.`,
      },
    ],
  });

  return response.choices[0].message.content;
}