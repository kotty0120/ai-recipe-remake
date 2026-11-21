export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  originalIngredient?: string; // Before（元の材料と分量、例：薄力粉 100g）
  isSubstituted: boolean;
  substitutionReason?: string; // 代替の科学的な理由（保水性・食感など）
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  cookingTime: number;
  reproducibility: '高' | '中' | '工夫が必要'; // AIによる再現性の見込み
  reproducibilityNote: string; // 再現性の根拠や仕上がり予想
  nutritionEstimate?: string; // 推定栄養変化の目安（例：推定糖質 約35%オフ / タンパク質 +8g ※AI推定値）
  failurePoints: string[]; // 失敗しやすいポイントと対策
  ingredients: Ingredient[];
  steps: string[];
  cookNote?: string; // 実際に作ったあとの自分用メモ
  createdAt: string;
}