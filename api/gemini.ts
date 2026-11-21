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

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'サーバー側にGEMINI_API_KEYが設定されていません。' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { prompt, inlineData } = body || {};

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'プロンプトが空です。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parts: any[] = [{ text: prompt + '\n※各説明文は簡潔に1文で出力してください。' }];
    if (inlineData && inlineData.mime_type && inlineData.data) {
      parts.push({ inline_data: inlineData });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1600,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `HTTP ${response.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(JSON.stringify({ error: 'AIからの応答が空でした。' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        text: rawText,
        modelUsed: 'gemini-3.8-flash',
        usageMetadata: data.usageMetadata || null,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `AI処理に失敗しました: ${err.message || '通信エラー'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
