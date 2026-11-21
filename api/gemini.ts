export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'サーバー側にGEMINI_API_KEYが設定されていません。' });
  }

  const { prompt, inlineData } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'プロンプトが空です。' });
  }

  const parts: any[] = [{ text: prompt + '\n※各説明文は簡潔に1文で出力してください。' }];
  if (inlineData && inlineData.mime_type && inlineData.data) {
    parts.push({ inline_data: inlineData });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

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
            maxOutputTokens: 1600,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || `HTTP ${response.status}`;
      return res.status(response.status).json({ error: msg });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({ error: 'AIからの応答が空でした。' });
    }

    return res.status(200).json({
      text: rawText,
      modelUsed: 'gemini-3.8-flash',
      usageMetadata: data.usageMetadata || null,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const msg =
      err.name === 'AbortError'
        ? '処理がタイムアウトしました。もう一度お試しください。'
        : err.message || '通信エラー';
    return res.status(500).json({ error: `AI処理に失敗しました: ${msg}` });
  }
}
