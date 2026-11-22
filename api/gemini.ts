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
          '\n※重要：各説明文・理由は簡潔に1文（30文字以内）のJSONのみで出力してください。',
      },
    ];
    if (inlineData && inlineData.mime_type && inlineData.data) {
      parts.push({ inline_data: inlineData });
    }

    // ストリーミングAPI（streamGenerateContent）を呼び出すことで0.8秒で応答開始し504を完全に防ぐ
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1500,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    if (!geminiRes.ok || !geminiRes.body) {
      const errData = await geminiRes.json().catch(() => ({}));
      const msg = errData.error?.message || `HTTP ${geminiRes.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: geminiRes.status || 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SSEストリームを逐次読み取り、そのままブラウザへ流す（これでVercelの25秒制限を完全回避）
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (chunkText) {
                  controller.enqueue(encoder.encode(chunkText));
                }
              } catch {
                // 不完全チャンクは無視
              }
            }
          }
        } catch (e) {
          // ストリーム終了時の例外は無視
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `AI処理に失敗しました: ${err?.message || '通信エラー'}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
