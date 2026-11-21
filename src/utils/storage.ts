import type { Recipe } from '../types/recipe';

const RECIPES_KEY = 'ai_recipe_remake_saved_recipes';
const INGREDIENTS_KEY = 'ai_recipe_remake_my_ingredients';

// 保存済みレシピの取得
export const getSavedRecipes = (): Recipe[] => {
  const data = localStorage.getItem(RECIPES_KEY);
  return data ? JSON.parse(data) : [];
};

// レシピの保存
export const saveRecipe = (recipe: Recipe): void => {
  const current = getSavedRecipes();
  const updated = [recipe, ...current];
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

// レシピの削除
export const deleteRecipe = (id: string): void => {
  const current = getSavedRecipes();
  const updated = current.filter((item) => item.id !== id);
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

// 手持ち食材リストの取得・保存
export const getMyIngredients = (): string[] => {
  const data = localStorage.getItem(INGREDIENTS_KEY);
  return data ? JSON.parse(data) : ['米粉', 'おからパウダー', 'デーツ', '豆乳ヨーグルト', 'オートミール'];
};

export const saveMyIngredients = (ingredients: string[]): void => {
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
};