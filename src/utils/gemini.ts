import type { Recipe } from '../types/recipe';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface TransformParams {
  inputType: 'image' | 'text';
  recipeText: string;
  imagePreview: string | null;
  selectedIngredients: string[];
  preference: string;
}

// 試行するモデルの優先順位リスト
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.0-flash',
  'gemini-2.0-flash',
];

export const transformRecipeWithGemini = async (
  params: TransformParams
): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  if (!API_KEY) {
    throw new Error('APIキーが設定されていません。.env.localを確認してサーバーを再起動してください。');
  }

  const prompt = `
あなたはプロの料理研究家兼管理栄養士です。
ユーザーの「元レシピ（テキストまたは画像）」を解析し、指定された「使いたい手持ち食材」と「アレンジの方向性」に合わせて、美味しく失敗しないヘルシーレシピに再構築してください。

【使いたい手持ち食材】
${params.selectedIngredients.join('、') || '特になし（一般的なヘルシー食材で代替）'}

【アレンジの方向性】
${params.preference}

【元レシピのテキスト情報】
${params.recipeText}

【重要な出力ルール】
1. 食材を代替した場合（例：小麦粉→米粉、砂糖→デーツ、バター→豆乳など）は、吸水性や甘み・油脂分の違いを考慮して、他の材料の分量や加熱時間・温度も論理的に再計算してください。
2. 代替した材料には isSubstituted: true を設定し、substitutionReason に「なぜこの分量・調理法に変えたのか」の理由を分かりやすく書いてください。
3. 必ず以下のJSONフォーマットのみを出力してください（余計な挨拶や説明文は一切書かないでください）。

{
  "title": "再構築後の魅力的な料理名",
  "description": "アレンジのポイントや特徴の解説（2〜3文）",
  "servings": 2,
  "cookingTime": 25,
  "ingredients": [
    {
      "id": "1",
      "name": "食材名",
      "amount": "分量（数値のみ、例：80）",
      "unit": "単位（例：g、ml、個、大さじ1）",
      "isSubstituted": true,
      "substitutionReason": "代替の理由や調理のコツ（代替していない場合は空文字）"
    }
  ],
  "steps": [
    "手順1の説明",
    "手順2の説明"
  ]
}
`;

  const parts: any[] = [{ text: prompt }];

  if (params.inputType === 'image' && params.imagePreview) {
    const match = params.imagePreview.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.push({
        inline_data: {
          mime_type: match[1],
          data: match[2],
        },
      });
    }
  }

  let lastErrorMessage = '';

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts }],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastErrorMessage = errorData.error?.message || `HTTP ${response.status} (${model})`;
        // 500エラーや404（モデル非対応）の場合は次の候補モデルを試す
        if (response.status === 500 || response.status === 404 || response.status === 400) {
          continue;
        }
        throw new Error(lastErrorMessage);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        lastErrorMessage = 'AIからの応答が空でした。';
        continue;
      }

      // ```json ... ``` で囲まれて返ってきた場合でも中身だけ安全に抽出
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastErrorMessage = 'JSON形式の抽出に失敗しました。';
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || 'アレンジレシピ',
        description: parsed.description || '',
        servings: Number(parsed.servings) || 2,
        cookingTime: Number(parsed.cookingTime) || 20,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      };
    } catch (err: any) {
      lastErrorMessage = err.message || '通信エラー';
    }
  }

  throw new Error(`すべてのモデルで生成に失敗しました。詳細: ${lastErrorMessage}`);
};