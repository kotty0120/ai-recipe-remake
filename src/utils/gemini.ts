import type { Recipe } from '../types/recipe';
import { getTasteProfile } from './storage';

interface TransformParams {
  inputType: 'image' | 'text';
  recipeText: string;
  imagePreview: string | null;
  selectedIngredients: string[];
  preferences: string[];
}

async function callGeminiSecurely(
  prompt: string,
  inlineData?: { mime_type: string; data: string }
): Promise<string> {
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, inlineData }),
      });

      const textBody = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(textBody);
      } catch {
        throw new Error(`サーバー応答エラー (HTTP ${res.status}): ${textBody.slice(0, 120)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `サーバーエラー (HTTP ${res.status})`);
      }
      if (data.text) {
        return data.text;
      }
      throw new Error('AIからの応答が空でした。');
    } catch (err: any) {
      lastErr = err?.message || '通信エラー';
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
    }
  }
  throw new Error(`${lastErr}`);
}

export const transformRecipeWithGemini = async (
  params: TransformParams
): Promise<Omit<Recipe, 'id' | 'createdAt'>> => {
  const profile = getTasteProfile();
  const topIngredients = Object.entries(profile.favoriteIngredients)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const prompt = `
あなたはプロの料理研究家・パティシエ兼管理栄養士です。
ユーザーの「食べたい元レシピ（テキストまたは画像）」を解析し、指定された「アレンジの方向性」と「使いたい手持ち食材」、さらにユーザーの「学習済み味覚プロファイル（My Taste Memory）」に合わせて、本当に美味しく失敗しないレシピへ再構築してください。

【アレンジの方向性】
${params.preferences.join('、') || 'おまかせ（美味しさと心地よさのバランス重視）'}

【使いたい手持ち食材】
${params.selectedIngredients.join('、') || '特になし（スーパーで手に入りやすい最適な代替食材を提案）'}

【ユーザーの学習済み味覚プロファイル（My Taste Memory）】
- 好みの食感・味わい傾向: ${profile.texturePreference}
- 普段よく使うお気に入り代替食材: ${topIngredients.join('、') || 'まだ学習中'}

【元レシピの情報】
${params.recipeText}

【重要な設計・出力ルール】
1. 食材の役割（小麦粉＝構造・グルテン、砂糖＝甘み・保水性・焼き色、バター＝風味・コク・乳化、卵＝結着・膨張など）を考慮し、単純置換ではなく水分量・油分量・加熱温度・焼き時間を論理的に再計算してください。特に米粉・焼き菓子の置換では、吸水性や膨らみ方の違いを丁寧に調整してください。
2. 「腸活（発酵・食物繊維）」が指定されている場合は、料理のジャンルや味わいに自然に馴染む発酵食品（塩麹、甘酒、味噌、ヨーグルト等）や食物繊維・オリゴ糖（オートミール、おから、はちみつ等）を無理なく取り入れてください。
3. 代替した材料には isSubstituted: true を設定し、originalIngredient に「元の材料名と分量（例：薄力粉 100g）」を記載し、substitutionReason に「なぜこの分量・調理法に変えたのか」を書いてください。
4. 実際の調理で失敗しやすいポイント（生地の硬さの目安、焦げやすさ、混ぜすぎ注意など）を failurePoints に2〜3個具体的に挙げてください。
5. 必ず以下のJSONフォーマットのみを出力してください（余計な挨拶やマークダウン記号は不要です）。

{
  "title": "再構築後の魅力的な料理名",
  "description": "今回の再構築のコンセプトと美味しさのポイント（2〜3文）",
  "servings": 2,
  "cookingTime": 25,
  "reproducibility": "高",
  "reproducibilityNote": "再現性の根拠や仕上がりの食感予想（1〜2文）",
  "nutritionEstimate": "元レシピ比での栄養変化の目安（例：推定糖質 約30%オフ / グルテンフリー ※AIによる概算推定値）",
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

  let inlineData: { mime_type: string; data: string } | undefined;
  if (params.inputType === 'image' && params.imagePreview) {
    const match = params.imagePreview.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      inlineData = {
        mime_type: match[1],
        data: match[2],
      };
    }
  }

  const rawText = await callGeminiSecurely(prompt, inlineData);
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('レシピデータの解析に失敗しました。もう一度お試しください。');
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
};

export interface KitchenIdea {
  title: string;
  description: string;
  cookingTime: number;
  usedIngredients: string[];
  extraIngredientTip: string;
}

export const suggestRecipesFromKitchen = async (
  ingredients: string[],
  mood: string
): Promise<KitchenIdea[]> => {
  const profile = getTasteProfile();

  const prompt = `
あなたはプロの料理研究家兼管理栄養士です。
ユーザーの「今家にある食材」と「今の気分・食べたいジャンル」、さらに「学習済み味覚プロファイル（My Taste Memory）」をもとに、美味しく失敗しないレシピのアイデアを3つ提案してください。

【今家にある食材】
${ingredients.join('、') || '米粉、卵、豆乳、バナナ'}

【今の気分・食べたいジャンル】
${mood || '甘いものが食べたい'}

【ユーザーの好み（My Taste Memory）】
${profile.texturePreference}

【重要な出力ルール】
1. 3つのレシピは食感や調理法（焼く・混ぜるだけ・レンジなど）のバリエーションを変えて提案してください。
2. 各レシピについて、家にある食材をどう活かすかと、「あと1つ買い足すなら（または家にあれば加えると最高な食材）」を1つ提案してください。
3. 必ず以下のJSON配列フォーマットのみを出力してください（余計な挨拶やマークダウン記号は不要です）。

[
  {
    "title": "レシピ案のタイトル",
    "description": "どんな味わい・食感になるかの魅力的な説明（2文程度）",
    "cookingTime": 20,
    "usedIngredients": ["使用する手持ち食材1", "使用する手持ち食材2"],
    "extraIngredientTip": "あと1つ加えるなら：〇〇（理由）"
  }
]
`;

  const rawText = await callGeminiSecurely(prompt);
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('レシピ案の解析に失敗しました。もう一度お試しください。');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) {
    throw new Error('提案データの形式が正しくありません。');
  }

  return parsed.map((item: any) => ({
    title: item.title || 'おすすめアレンジレシピ',
    description: item.description || '',
    cookingTime: Number(item.cookingTime) || 20,
    usedIngredients: Array.isArray(item.usedIngredients) ? item.usedIngredients : [],
    extraIngredientTip: item.extraIngredientTip || '',
  }));
};
