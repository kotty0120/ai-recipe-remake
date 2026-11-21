export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  isSubstituted?: boolean;
  substitutionReason?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  cookingTime: number;
  ingredients: Ingredient[];
  steps: string[];
  createdAt: string;
}