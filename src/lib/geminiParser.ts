import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedIngredient } from "@/types";

const INGREDIENT_PROMPT = `
Analyze this recipe and format ONLY the ingredients as follows:
decimal_quantity | unit | item | prep_notes | category

Rules:
1. DO NOT add any bullet points, dashes, or additional formatting
2. Convert ALL fractions to decimals (½ → 0.5, ¾ → 0.75, etc.)
3. For items without units, leave the unit field empty but keep the pipe
4. If no prep notes, leave that field empty but keep the pipe
5. Each line should have exactly 4 pipes (|)
6. If a unit seems odd (like c.) use your best judgement to assign an appropriate unit (cup)
7. For ingredients without specified quantities (like garnishes or "to taste" items), use 0.0 as the quantity
8. When ranges of quantities are provided (like 5-6), use the largest quantity
9. When encountering quantities with letters (like 100g orange juice), this typically indicates a quantity and a unit
10. When multiple units are provided, use grams
11. For the category field, assign one of the following categories based on the ingredient type:
   - Produce (for fruits and vegetables)
   - Meat & Seafood
   - Dairy & Eggs
   - Bakery (for breads, baked goods)
   - Pantry (for dry goods, grains)
   - Canned Goods
   - Frozen Foods
   - Condiments & Sauces
   - Herbs & Spices
   - Oils & Vinegars
   - Snacks
   - Beverages
   - Baking (for baking ingredients)
   - Pasta & Rice
   - Nuts & Seeds
   - International (for ethnic ingredients)
   - Other (if unsure)

Example output format:
0.5 | cup | onion | minced | Produce
1.0 | pound | ground beef | | Meat & Seafood
2.0 | | eggs | beaten | Dairy & Eggs
1.0 | (14 ounce) can | diced tomatoes | | Canned Goods
0.0 | | fresh parsley | for garnish | Herbs & Spices
0.0 | | salt | to taste | Herbs & Spices
100 | g | orange juice | | Beverages
`;

import { guessIngredientCategory } from "./ingredientTags";

export async function parseIngredientsWithGemini(
  text: string,
): Promise<ParsedIngredient[]> {
  try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = INGREDIENT_PROMPT + "\n\nIngredients to parse:\n" + text;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    return content
      .trim()
      .split("\n")
      .filter((line) => line && line.includes("|"))
      .map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        const [quantity, unit, item] = parts;
        const notes = parts[3] || "";
        // Use the category from the parser if available, otherwise guess based on the item name
        const category = parts[4] || guessIngredientCategory(item);

        return {
          quantity: parseFloat(quantity) || 0,
          unit: unit || "",
          item: item || "",
          notes: notes || undefined,
          category: category || "Other",
        };
      });
  } catch (error) {
    console.error("Error parsing ingredients with Gemini:", error);
    throw new Error("Failed to parse ingredients with Gemini");
  }
}
