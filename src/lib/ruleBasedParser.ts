interface ParsedIngredient {
  quantity: number;
  unit: string;
  item: string;
  notes?: string;
  category?: string;
}

function convertFractionToDecimal(fraction: string): number {
  if (fraction.includes("/")) {
    const [numerator, denominator] = fraction.split("/");
    return Number(numerator) / Number(denominator);
  }
  return Number(fraction);
}

function parseQuantity(quantityStr: string): number {
  if (!quantityStr) return 0;

  // Handle ranges (e.g., "2-3" or "2 to 3") by taking the larger number
  if (quantityStr.includes("-") || quantityStr.includes(" to ")) {
    const parts = quantityStr.split(/-| to /);
    return Math.max(...parts.map((p) => convertFractionToDecimal(p.trim())));
  }

  // Handle mixed numbers (e.g., "1 1/2")
  const parts = quantityStr.trim().split(" ");
  if (parts.length > 1) {
    return parts.reduce((sum, part) => sum + convertFractionToDecimal(part), 0);
  }

  return convertFractionToDecimal(quantityStr);
}

import { guessIngredientCategory } from "./ingredientTags";

export function parseIngredientLine(line: string): ParsedIngredient | null {
  // Skip empty lines
  if (!line.trim()) return null;

  // Special case: salt and pepper
  if (line.toLowerCase().includes("salt and pepper to taste")) {
    return [
      {
        quantity: 0,
        unit: "",
        item: "salt",
        notes: "to taste",
        category: "Herbs & Spices",
      },
      {
        quantity: 0,
        unit: "",
        item: "pepper",
        notes: "to taste",
        category: "Herbs & Spices",
      },
    ];
  }

  let cleanedLine = line.trim();
  let notes = "";

  // Extract notes after comma
  const commaIndex = cleanedLine.indexOf(",");
  if (commaIndex !== -1) {
    notes = cleanedLine.slice(commaIndex + 1).trim();
    cleanedLine = cleanedLine.slice(0, commaIndex).trim();
  }

  // Extract (Optional) or optional
  if (cleanedLine.toLowerCase().includes("optional")) {
    notes = (notes ? notes + " " : "") + "(Optional)";
    cleanedLine = cleanedLine.replace(/\(?optional\)?/i, "").trim();
  }

  // Extract 'to taste'
  if (cleanedLine.toLowerCase().includes("to taste")) {
    notes = "to taste";
    cleanedLine = cleanedLine.replace(/to taste/i, "").trim();
  }

  // Handle canned items
  const canMatch = cleanedLine.match(
    /^(\d+)?\s*\((\d+(?:\.\d+)?)\s*(\w+)\)\s*(can)?\s*(.+)$/,
  );
  if (canMatch) {
    const [, qty, size, sizeUnit, , item] = canMatch;
    return {
      quantity: parseQuantity(qty || "1"),
      unit: `(${size} ${sizeUnit}) can`,
      item: item.trim(),
      notes,
    };
  }

  // Handle standard format
  const parts = cleanedLine.split(/\s+/);
  let quantity = "0";
  let unit = "";
  let item = "";

  // Try to parse first part as quantity
  if (/^\d|½|\//.test(parts[0])) {
    quantity = parts[0].replace("½", "1/2");
    parts.shift();

    // Check for additional fraction part
    if (parts.length && /^\d|\//.test(parts[0])) {
      quantity += " " + parts[0];
      parts.shift();
    }
  }

  // Check if next part could be a unit
  const commonUnits = [
    "cup",
    "cups",
    "tablespoon",
    "tablespoons",
    "teaspoon",
    "teaspoons",
    "pound",
    "pounds",
    "ounce",
    "ounces",
    "gram",
    "grams",
    "kg",
    "ml",
    "pinch",
    "can",
    "cans",
  ];
  if (parts.length && commonUnits.includes(parts[0].toLowerCase())) {
    unit = parts[0].toLowerCase();
    parts.shift();
  }

  item = parts.join(" ").trim();

  return {
    quantity: parseQuantity(quantity),
    unit,
    item,
    notes,
    category: guessIngredientCategory(item),
  };
}

export function parseIngredientsWithRules(text: string): ParsedIngredient[] {
  const results: ParsedIngredient[] = [];

  text.split("\n").forEach((line) => {
    const parsed = parseIngredientLine(line);
    if (parsed) {
      if (Array.isArray(parsed)) {
        results.push(...parsed);
      } else {
        results.push(parsed);
      }
    }
  });

  return results;
}
