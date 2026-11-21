export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Vercel側の環境変数 GEMINI_API_KEY がまだ読み込まれていません（Production設定とRedeployを確認してください）。',
    });
  }

  const { prompt, inlineData } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'プロンプトが空です。' });
  }

  const parts: any[] = [
    {
      text:
        prompt +
        '\n※重要：Vercelの応答制限内に収めるため、すべての説明文は簡潔に1文（35文字以内）で出力してください。',
    },
  ];
  if (inlineData && inlineData.mime_type && inlineData.data) {
    parts.push({ inline_data: inlineData });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1200,
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
    return res.status(500).json({
      error: `AI処理に失敗しました: ${err.message || '通信エラー'}`,
    });
  }
}
