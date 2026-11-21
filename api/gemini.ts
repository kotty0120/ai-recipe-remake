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

  // 混雑時（503）に備えて最大3回まで間隔を空けて自動リトライする
  const attempts = [
    { model: 'gemini-3.8-flash', delayMs: 0 },
    { model: 'gemini-3.8-flash', delayMs: 1500 },
    { model: 'gemini-3.8-flash', delayMs: 2500 },
  ];

  let lastErrorMessage = '';

  for (const attempt of attempts) {
    if (attempt.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, attempt.delayMs));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: 'application/json',
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
        lastErrorMessage = errorData.error?.message || `HTTP ${response.status}`;
        // 503(高負荷・混雑)や429(一時制限)のときは自動で再試行へ進む
        if (response.status === 503 || response.status === 429 || response.status === 500) {
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
        modelUsed: attempt.model,
        usageMetadata: data.usageMetadata || null,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastErrorMessage =
        err.name === 'AbortError'
          ? '応答に時間がかかっています。'
          : err.message || '通信エラー';
    }
  }

  return res.status(503).json({
    error: `現在AIサーバーへのアクセスが集中しています。数秒おいて「もう一度試す」を押してください。（詳細: ${lastErrorMessage}）`,
  });
}
