import { OpenAI } from 'openai';


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getOpenAICompletion({ prompt, model = 'gpt-3.5-turbo', max_tokens = 512 }) {

    console.log('OpenAI API Key:', prompt);
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens,
  });
  return response.choices[0].message.content;
}
