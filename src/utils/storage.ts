import type { Recipe } from '../types/recipe';

const RECIPES_KEY = 'ai_recipe_remake_recipes_v2';
const INGREDIENTS_KEY = 'ai_recipe_remake_ingredients';
const PREFERENCES_KEY = 'ai_recipe_remake_preferences';

const DEFAULT_INGREDIENTS = [
  '米粉',
  'デーツ',
  'おからパウダー',
  '無調整豆乳',
  'オートミール',
  '鶏むね肉',
  '豆腐',
  'アーモンドミルク',
  'ラカント（低糖質甘味料）',
];

export const getSavedRecipes = (): Recipe[] => {
  try {
    const data = localStorage.getItem(RECIPES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveRecipe = (recipe: Recipe): void => {
  const current = getSavedRecipes();
  const updated = [recipe, ...current];
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

export const updateRecipeNote = (id: string, cookNote: string): void => {
  const current = getSavedRecipes();
  const updated = current.map((r) => (r.id === id ? { ...r, cookNote } : r));
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

export const deleteRecipe = (id: string): void => {
  const current = getSavedRecipes();
  const updated = current.filter((r) => r.id !== id);
  localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
};

export const getMyIngredients = (): string[] => {
  try {
    const data = localStorage.getItem(INGREDIENTS_KEY);
    return data ? JSON.parse(data) : DEFAULT_INGREDIENTS;
  } catch {
    return DEFAULT_INGREDIENTS;
  }
};

export const saveMyIngredients = (ingredients: string[]): void => {
  localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
};

export const getLastPreferences = (): string[] => {
  try {
    const data = localStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : ['砂糖控えめ'];
  } catch {
    return ['砂糖控えめ'];
  }
};

export const saveLastPreferences = (prefs: string[]): void => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
};