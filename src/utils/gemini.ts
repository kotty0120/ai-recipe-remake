import type { Recipe } from '../types/recipe';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface TransformParams {
  inputType: 'image' | 'text';
  recipeText: string;
  imagePreview: string | null;
  selectedIngredients: string[];
  preferences: string[];
}

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
あなたはプロの料理研究家・パティシエ兼管理栄養士です。
ユーザーの「食べたい元レシピ（テキストまたは画像）」を解析し、指定された「アレンジの方向性」と「使いたい手持ち食材」に合わせて、本当に美味しく失敗しないレシピへ再構築してください。

【アレンジの方向性】
${params.preferences.join('、') || 'おまかせ（美味しさとヘルシーさのバランス重視）'}

【使いたい手持ち食材】
${params.selectedIngredients.join('、') || '特になし（スーパーで手に入りやすい最適な代替食材を提案）'}

【元レシピの情報】
${params.recipeText}

【重要な設計・出力ルール】
1. 食材の役割（小麦粉＝構造・グルテン、砂糖＝甘み・保水性・焼き色、バター＝風味・コク・乳化、卵＝結着・膨張など）を考慮し、単純置換ではなく水分量・油分量・加熱温度・焼き時間を論理的に再計算してください。
2. 代替した材料には isSubstituted: true を設定し、originalIngredient に「元の材料名と分量（例：薄力粉 100g）」を記載し、substitutionReason に「なぜこの分量・調理法に変えたのか」を書いてください。
3. 実際の調理で失敗しやすいポイント（生地の硬さの目安、焦げやすさ、混ぜすぎ注意など）を failurePoints に2〜3個具体的に挙げてください。
4. 必ず以下のJSONフォーマットのみを出力してください（余計な挨拶やマークダウン記号は不要です）。

{
  "title": "再構築後の魅力的な料理名",
  "description": "今回の再構築のコンセプトと美味しさのポイント（2〜3文）",
  "servings": 2,
  "cookingTime": 25,
  "reproducibility": "高",
  "reproducibilityNote": "再現性の根拠や仕上がりの食感予想（1〜2文）",
  "nutritionEstimate": "元レシピ比での栄養変化の目安（例：推定糖質 約30%オフ / 脂質 約25%カット ※AIによる概算推定値）",
  "failurePoints": [
    "失敗しやすいポイント1と対策",
    "失敗しやすいポイント2と対策"
  ],
  "ingredients": [
    {
      "id": "1",
      "name": "代替後の食材名",
      "amount": "分量（数値など、例：80）",
      "unit": "単位（例：g、ml、個、大さじ1）",
      "originalIngredient": "元の食材と分量（例：薄力粉 100g）",
      "isSubstituted": true,
      "substitutionReason": "代替の理由と水分・温度調整の根拠"
    }
  ],
  "steps": [
    "手順1の説明（失敗しないコツも含める）",
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

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        lastErrorMessage = 'JSON形式の抽出に失敗しました。';
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validRepro = ['高', '中', '工夫が必要'].includes(parsed.reproducibility)
        ? parsed.reproducibility
        : '高';

      return {
        title: parsed.title || 'Re:Make アレンジレシピ',
        description: parsed.description || '',
        servings: Number(parsed.servings) || 2,
        cookingTime: Number(parsed.cookingTime) || 20,
        reproducibility: validRepro,
        reproducibilityNote: parsed.reproducibilityNote || '',
        nutritionEstimate: parsed.nutritionEstimate || '※AIによる推定目安です',
        failurePoints: Array.isArray(parsed.failurePoints) ? parsed.failurePoints : [],
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      };
    } catch (err: any) {
      lastErrorMessage = err.message || '通信エラー';
    }
  }

  throw new Error(`レシピの再構築に失敗しました。詳細: ${lastErrorMessage}`);
};