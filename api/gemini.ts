export const config = {
  runtime: 'edge',
};

const MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) ||
    (globalThis as any).GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Vercelの環境変数 GEMINI_API_KEY が見つかりません。' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, inlineData } = (await req.json()) || {};
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'プロンプトが空です。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parts: any[] = [
      {
        text:
          prompt +
          '\n※重要：高速表示のため、すべての説明文は簡潔に1文（35文字以内）で出力してください。',
      },
    ];
    if (inlineData && inlineData.mime_type && inlineData.data) {
      parts.push({ inline_data: inlineData });
    }

    let lastErr = '';

    for (const model of MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: 1200,
                ...(model.startsWith('gemini-3') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
              },
            }),
          }
        );
        clearTimeout(timer);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          lastErr = `${model}: ${errData.error?.message || `HTTP ${response.status}`}`;
          if ([503, 504, 429, 404, 400].includes(response.status)) continue;
          return new Response(JSON.stringify({ error: lastErr }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastErr = `${model}: 応答が空でした`;
          continue;
        }

        return new Response(
          JSON.stringify({
            text: rawText,
            modelUsed: model,
            usageMetadata: data.usageMetadata || null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (e: any) {
        clearTimeout(timer);
        lastErr = e.name === 'AbortError' ? `${model}: 8秒タイムアウト` : e.message;
      }
    }

    return new Response(
      JSON.stringify({ error: `AIサーバーが混雑しています（${lastErr}）` }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `AI処理に失敗しました: ${err?.message || '通信エラー'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
