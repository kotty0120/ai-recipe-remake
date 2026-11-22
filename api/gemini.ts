export const config = {
  runtime: 'edge',
};

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
          '\n※超重要：3秒以内に高速生成するため、すべての説明文・理由は簡潔に1文（25文字以内）の短文JSONのみで出力してください。',
      },
    ];
    if (inlineData && inlineData.mime_type && inlineData.data) {
      parts.push({ inline_data: inlineData });
    }

    let lastErr = '';

    // 唯一の有効モデル gemini-3.8-flash で最大3回（503スパイク吸収リトライ）実行
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: 950,
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
            }),
          }
        );
        clearTimeout(timer);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          lastErr = errData.error?.message || `HTTP ${response.status}`;
          if ([503, 504, 429, 500].includes(response.status) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          return new Response(JSON.stringify({ error: lastErr }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastErr = 'AIからの応答が空でした';
          continue;
        }

        return new Response(
          JSON.stringify({
            text: rawText,
            modelUsed: 'gemini-3.8-flash',
            usageMetadata: data.usageMetadata || null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (e: any) {
        clearTimeout(timer);
        lastErr = e.name === 'AbortError' ? '応答が12秒を超えました' : e.message;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    return new Response(
      JSON.stringify({ error: `AIサーバーが一時混雑しています。もう一度お試しください（${lastErr}）` }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `AI処理に失敗しました: ${err?.message || '通信エラー'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
