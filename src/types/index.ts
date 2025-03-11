export interface UserPreferences {
  householdSize: number;
  mealTypes: ("breakfast" | "lunch" | "dinner" | "snacks")[];
}

export interface Recipe {
  id: string;
  userId?: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    category: string;
    notes?: string;
  }[];
  instructions: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
  image?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  id: string;
  userId?: string;
  name: string;
  weekStartDate: string;
  meals: {
    [key: string]: {
      recipeId: string;
      servings: number;
      mealType: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ParsedIngredient {
  quantity: number;
  unit: string;
  item: string;
  notes?: string;
  category?: string;
}
