import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedIngredient } from "@/types";

const INGREDIENT_PROMPT = `
Analyze this recipe and format ONLY the ingredients as follows:
decimal_quantity | unit | item | prep_notes

Rules:
1. DO NOT add any bullet points, dashes, or additional formatting
2. Convert ALL fractions to decimals (½ → 0.5, ¾ → 0.75, etc.)
3. For items without units, leave the unit field empty but keep the pipe
4. If no prep notes, leave that field empty but keep the pipe
5. Each line should have exactly 3 pipes (|)
6. If a unit seems odd (like c.) use your best judgement to assign an appropriate unit (cup)
7. For ingredients without specified quantities (like garnishes or "to taste" items), use 0.0 as the quantity
8. When ranges of quantities are provided (like 5-6), use the largest quantity
9. When encountering quantities with letters (like 100g orange juice), this typically indicates a quantity and a unit
10. When multiple units are provided, use grams

Example output format:
0.5 | cup | onion | minced
1.0 | pound | ground beef |
2.0 | | eggs | beaten
1.0 | (14 ounce) can | diced tomatoes |
0.0 | | fresh parsley | for garnish
0.0 | | salt | to taste
100 | g | orange juice |
`;

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
        const [quantity, unit, item, notes] = line
          .split("|")
          .map((s) => s.trim());
        return {
          quantity: parseFloat(quantity) || 0,
          unit: unit || "",
          item: item || "",
          notes: notes || undefined,
        };
      });
  } catch (error) {
    console.error("Error parsing ingredients with Gemini:", error);
    throw new Error("Failed to parse ingredients with Gemini");
  }
}
