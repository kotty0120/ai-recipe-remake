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

  const parts: any[] = [{ text: prompt }];
  if (inlineData && inlineData.mime_type && inlineData.data) {
    parts.push({ inline_data: inlineData });
  }

  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.0-flash',
    'gemini-2.0-flash',
  ];

  let lastErrorMessage = '';

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastErrorMessage = errorData.error?.message || `HTTP ${response.status} (${model})`;
        if (response.status === 500 || response.status === 404 || response.status === 400) {
          continue;
        }
        return res.status(response.status).json({ error: lastErrorMessage });
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastErrorMessage = 'AIからの応答が空でした。';
        continue;
      }

      return res.status(200).json({
        text: rawText,
        modelUsed: model,
        usageMetadata: data.usageMetadata || null,
      });
    } catch (err: any) {
      lastErrorMessage = err.message || '通信エラー';
    }
  }

  return res.status(500).json({ error: `AI処理に失敗しました: ${lastErrorMessage}` });
}
