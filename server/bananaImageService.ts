// Clean Banana image service
import nodeFetch from 'node-fetch';
globalThis.fetch = (nodeFetch as unknown) as typeof fetch;

export interface BananaImageGenerationResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

/**
 * Call a Banana-hosted Gemini image endpoint. Uses OPENROUTER_GEMINI_API_KEY or BANANA_API_KEY as the credential.
 * Returns either an image URL/data URI or a data:text description when the endpoint returns only text.
 */
export async function generateImageWithBanana(prompt: string): Promise<BananaImageGenerationResult> {
    const bananaKey = process.env.OPENROUTER_GEMINI_API_KEY || process.env.BANANA_API_KEY;
    if (!bananaKey) {
        return { success: false, error: 'Banana Gemini API key is not configured (OPENROUTER_GEMINI_API_KEY or BANANA_API_KEY).' };
    }

    const apiUrl = process.env.BANANA_API_URL || process.env.BANANA_ENDPOINT || 'https://api.banana.dev/run';
    const modelKey = process.env.BANANA_MODEL_KEY || process.env.BANANA_MODEL || 'google/gemini-2.5-flash-image-preview';

    try {
        const body: any = { modelKey, input: { prompt } };
        const resp = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bananaKey}` },
            body: JSON.stringify(body)
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            return { success: false, error: `Banana API error: ${resp.status} ${text}` };
        }

        const data = await resp.json().catch(() => ({}));

        // Common shapes
        if (data.imageUrl || data.url) return { success: true, imageUrl: data.imageUrl || data.url };
        if (Array.isArray(data.output) && data.output[0] && (data.output[0].image_url || data.output[0].url || data.output[0].imageUrl)) {
            return { success: true, imageUrl: data.output[0].image_url || data.output[0].url || data.output[0].imageUrl };
        }
        if (data.b64_image || (Array.isArray(data.data) && data.data[0] && data.data[0].b64_json)) {
            const b64 = data.b64_image || data.data[0].b64_json;
            return { success: true, imageUrl: `data:image/png;base64,${b64}` };
        }

        const maybeText = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || data.text || data.result || JSON.stringify(data).slice(0, 1000);
        if (maybeText && typeof maybeText === 'string') {
            const urlMatch = maybeText.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|webp|gif)(\?.*)?/i);
            if (urlMatch) return { success: true, imageUrl: urlMatch[0] };
            const dataUriMatch = maybeText.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/i);
            if (dataUriMatch) return { success: true, imageUrl: dataUriMatch[0] };
            return { success: true, imageUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(maybeText)}` };
        }

        return { success: false, error: 'Unexpected Banana response format.' };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
