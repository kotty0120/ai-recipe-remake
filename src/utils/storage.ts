import type { Recipe } from '../types/recipe';

const RECIPES_KEY = 'ai_recipe_remake_recipes_v2';
const INGREDIENTS_KEY = 'ai_recipe_remake_ingredients';
const PREFERENCES_KEY = 'ai_recipe_remake_preferences';
const TASTE_PROFILE_KEY = 'ai_recipe_remake_taste_profile';

export interface TasteProfile {
  favoritePreferences: Record<string, number>;
  favoriteIngredients: Record<string, number>;
  texturePreference: string;
  totalRemakes: number;
}

const DEFAULT_TASTE_PROFILE: TasteProfile = {
  favoritePreferences: {},
  favoriteIngredients: {},
  texturePreference: 'しっとり・甘さ控えめ・素材の風味を活かした仕上がり',
  totalRemakes: 0,
};

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

  const profile = getTasteProfile();
  recipe.ingredients.forEach((ing) => {
    if (ing.isSubstituted && ing.name) {
      profile.favoriteIngredients[ing.name] = (profile.favoriteIngredients[ing.name] || 0) + 1;
    }
  });
  profile.totalRemakes += 1;
  saveTasteProfile(profile);
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

  const profile = getTasteProfile();
  prefs.forEach((p) => {
    profile.favoritePreferences[p] = (profile.favoritePreferences[p] || 0) + 1;
  });
  saveTasteProfile(profile);
};

export const getTasteProfile = (): TasteProfile => {
  try {
    const data = localStorage.getItem(TASTE_PROFILE_KEY);
    return data ? { ...DEFAULT_TASTE_PROFILE, ...JSON.parse(data) } : DEFAULT_TASTE_PROFILE;
  } catch {
    return DEFAULT_TASTE_PROFILE;
  }
};

export const saveTasteProfile = (profile: TasteProfile): void => {
  localStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(profile));
};