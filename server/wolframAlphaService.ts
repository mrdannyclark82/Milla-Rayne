import fetch from 'node-fetch';

export async function queryWolframAlpha(
  query: string,
  appId: string
): Promise<string | null> {
  const endpoint = `https://api.wolframalpha.com/v1/result?i=${encodeURIComponent(query)}&appid=${appId}`;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error('Wolfram Alpha API error:', error);
    return null;
  }
}
