import { parseIngredientsWithRules } from "../ruleBasedParser";
import { parseIngredientsFromText } from "../recipeParser";

interface TestCase {
  input: string;
  expected: {
    quantity: number;
    unit: string;
    item: string;
    notes?: string;
  };
}

const testCases: TestCase[] = [
  {
    input: "2 cups flour",
    expected: { quantity: 2, unit: "cups", item: "flour" },
  },
  {
    input: "1/2 tablespoon salt",
    expected: { quantity: 0.5, unit: "tablespoon", item: "salt" },
  },
  {
    input: "3-4 large eggs, beaten",
    expected: { quantity: 4, unit: "", item: "large eggs", notes: "beaten" },
  },
  // Add more test cases here
];

async function compareParserOutputs(input: string) {
  console.log("\nTesting Input:", input);

  // Rule-based parser output
  const ruleBasedOutput = parseIngredientsWithRules(input);
  console.log("Rule-based Output:", ruleBasedOutput);

  // LLM parser output
  const llmOutput = await parseIngredientsFromText(input);
  console.log("LLM Output:", llmOutput);

  // Compare outputs
  console.log("\nDifferences:");
  if (ruleBasedOutput.length !== llmOutput.length) {
    console.log(
      `Length mismatch: Rule-based (${ruleBasedOutput.length}) vs LLM (${llmOutput.length})`,
    );
  }

  const maxLength = Math.max(ruleBasedOutput.length, llmOutput.length);
  for (let i = 0; i < maxLength; i++) {
    const ruleBasedItem = ruleBasedOutput[i];
    const llmItem = llmOutput[i];

    if (!ruleBasedItem || !llmItem) {
      console.log(
        `Index ${i}: Missing in ${!ruleBasedItem ? "rule-based" : "LLM"} parser`,
      );
      continue;
    }

    const differences: Record<string, { ruleBased: any; llm: any }> = {};

    ["quantity", "unit", "item", "notes"].forEach((key) => {
      if (ruleBasedItem[key] !== llmItem[key]) {
        differences[key] = {
          ruleBased: ruleBasedItem[key],
          llm: llmItem[key],
        };
      }
    });

    if (Object.keys(differences).length > 0) {
      console.log(`Index ${i} differences:`, differences);
    }
  }
}

// Test runner
export async function runParserTests(customInput?: string) {
  if (customInput) {
    await compareParserOutputs(customInput);
    return;
  }

  console.log("Running standard test cases...");
  for (const testCase of testCases) {
    await compareParserOutputs(testCase.input);
  }
}
