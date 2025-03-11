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

function parseIngredientLines(content: string): ParsedIngredient[] {
  // First, clean up the content by removing any lines that don't match our format
  const lines = content
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line && !line.startsWith("Here") && !line.startsWith("I"),
    );

  console.log("Cleaned lines:", lines);

  return lines
    .filter((line) => {
      const parts = line.split("|");
      // Now expecting 5 parts with the category added
      const isValid =
        (parts.length === 5 || parts.length === 4) &&
        !isNaN(parseFloat(parts[0].trim()));
      if (!isValid) {
        console.log("Invalid line:", line);
      }
      return isValid;
    })
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      const [quantity, unit, item] = parts;
      const notes = parts[3] || "";
      // Use the category from the parser if available, otherwise guess based on the item name
      const category = parts[4] || guessIngredientCategory(item);

      const parsed = {
        quantity: parseFloat(quantity),
        unit,
        item,
        notes: notes || undefined,
        category,
      };
      console.log("Parsed ingredient:", parsed);
      return parsed;
    });
}

export async function parseIngredientsFromText(
  text: string,
): Promise<ParsedIngredient[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content:
              INGREDIENT_PROMPT + "\n\nIngredients text to parse:\n" + text,
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    console.log("Raw API Response:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Unexpected API response:", data);
      throw new Error("Invalid API response");
    }

    const content = data.choices[0].message.content;
    console.log("API Response Content:", content);

    const ingredients = parseIngredientLines(content);
    console.log("Final Parsed Ingredients:", ingredients);

    return ingredients;
  } catch (error) {
    console.error("Error parsing ingredients:", error);
    throw new Error("Failed to parse ingredients");
  }
}

export async function parseIngredientsFromImage(
  imageFile: File,
): Promise<ParsedIngredient[]> {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract the base64 part after the data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: INGREDIENT_PROMPT,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    console.log("Raw API Response:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Unexpected API response:", data);
      throw new Error("Invalid API response");
    }

    const content = data.choices[0].message.content;
    console.log("API Response Content:", content);

    const ingredients = parseIngredientLines(content);
    console.log("Final Parsed Ingredients:", ingredients);

    return ingredients;
  } catch (error) {
    console.error("Error parsing ingredients from image:", error);
    throw new Error("Failed to parse ingredients from image");
  }
}
