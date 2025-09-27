import { Mistral } from '@mistralai/mistralai';

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "mistral-ai/mistral-medium-2505";

export async function main() {

  const client = new Mistral({apiKey: token, serverURL: endpoint});

  const response = await client.chat.complete({
    model: model,
    messages: [
      { role:"system", content: "You are a helpful assistant." },
      { role:"user", content: "What is the capital of France?" }
    ],
    temperature: 1.0,
    max_tokens: 1000,
    top_p: 1.0
  });

  console.log(response.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
