// Standard ingredient categories for shopping lists
export const INGREDIENT_TAGS = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Pantry",
  "Canned Goods",
  "Frozen Foods",
  "Condiments & Sauces",
  "Herbs & Spices",
  "Oils & Vinegars",
  "Snacks",
  "Beverages",
  "Baking",
  "Pasta & Rice",
  "Nuts & Seeds",
  "International",
  "Other",
];

// Mapping common ingredients to their categories
export const INGREDIENT_CATEGORY_MAPPING: Record<string, string> = {
  // Produce
  apple: "Produce",
  banana: "Produce",
  orange: "Produce",
  lemon: "Produce",
  lime: "Produce",
  lettuce: "Produce",
  spinach: "Produce",
  kale: "Produce",
  carrot: "Produce",
  potato: "Produce",
  onion: "Produce",
  garlic: "Produce",
  tomato: "Produce",
  cucumber: "Produce",
  "bell pepper": "Produce",
  broccoli: "Produce",
  cauliflower: "Produce",
  zucchini: "Produce",
  squash: "Produce",
  mushroom: "Produce",
  avocado: "Produce",
  corn: "Produce",
  "green bean": "Produce",
  pea: "Produce",
  celery: "Produce",
  ginger: "Produce",

  // Meat & Seafood
  chicken: "Meat & Seafood",
  beef: "Meat & Seafood",
  pork: "Meat & Seafood",
  lamb: "Meat & Seafood",
  turkey: "Meat & Seafood",
  "ground beef": "Meat & Seafood",
  "ground turkey": "Meat & Seafood",
  sausage: "Meat & Seafood",
  bacon: "Meat & Seafood",
  ham: "Meat & Seafood",
  steak: "Meat & Seafood",
  fish: "Meat & Seafood",
  salmon: "Meat & Seafood",
  tuna: "Meat & Seafood",
  shrimp: "Meat & Seafood",
  crab: "Meat & Seafood",
  lobster: "Meat & Seafood",
  scallop: "Meat & Seafood",

  // Dairy & Eggs
  milk: "Dairy & Eggs",
  cream: "Dairy & Eggs",
  "half and half": "Dairy & Eggs",
  butter: "Dairy & Eggs",
  cheese: "Dairy & Eggs",
  cheddar: "Dairy & Eggs",
  mozzarella: "Dairy & Eggs",
  parmesan: "Dairy & Eggs",
  feta: "Dairy & Eggs",
  yogurt: "Dairy & Eggs",
  "sour cream": "Dairy & Eggs",
  "cream cheese": "Dairy & Eggs",
  egg: "Dairy & Eggs",

  // Bakery
  bread: "Bakery",
  roll: "Bakery",
  bun: "Bakery",
  bagel: "Bakery",
  pita: "Bakery",
  tortilla: "Bakery",
  croissant: "Bakery",
  muffin: "Bakery",

  // Pantry
  flour: "Pantry",
  sugar: "Pantry",
  "brown sugar": "Pantry",
  "powdered sugar": "Pantry",
  honey: "Pantry",
  "maple syrup": "Pantry",
  cereal: "Pantry",
  oatmeal: "Pantry",
  "pancake mix": "Pantry",
  "chocolate chip": "Pantry",
  broth: "Pantry",
  "beef broth": "Pantry",
  "chicken broth": "Pantry",
  "vegetable broth": "Pantry",
  stock: "Pantry",

  // Canned Goods
  "canned tomato": "Canned Goods",
  "tomato sauce": "Canned Goods",
  "tomato paste": "Canned Goods",
  "canned bean": "Canned Goods",
  "kidney bean": "Canned Goods",
  "black bean": "Canned Goods",
  chickpea: "Canned Goods",
  "canned corn": "Canned Goods",
  "canned tuna": "Canned Goods",
  "canned soup": "Canned Goods",

  // Frozen Foods
  "frozen vegetable": "Frozen Foods",
  "frozen fruit": "Frozen Foods",
  "ice cream": "Frozen Foods",
  "frozen pizza": "Frozen Foods",
  "frozen meal": "Frozen Foods",

  // Condiments & Sauces
  ketchup: "Condiments & Sauces",
  mustard: "Condiments & Sauces",
  mayonnaise: "Condiments & Sauces",
  "soy sauce": "Condiments & Sauces",
  "hot sauce": "Condiments & Sauces",
  "bbq sauce": "Condiments & Sauces",
  salsa: "Condiments & Sauces",
  jam: "Condiments & Sauces",
  jelly: "Condiments & Sauces",
  "peanut butter": "Condiments & Sauces",

  // Herbs & Spices
  salt: "Herbs & Spices",
  pepper: "Herbs & Spices",
  basil: "Herbs & Spices",
  oregano: "Herbs & Spices",
  thyme: "Herbs & Spices",
  rosemary: "Herbs & Spices",
  cinnamon: "Herbs & Spices",
  nutmeg: "Herbs & Spices",
  paprika: "Herbs & Spices",
  cumin: "Herbs & Spices",
  "chili powder": "Herbs & Spices",
  "bay leaf": "Herbs & Spices",

  // Oils & Vinegars
  "olive oil": "Oils & Vinegars",
  "vegetable oil": "Oils & Vinegars",
  "canola oil": "Oils & Vinegars",
  "coconut oil": "Oils & Vinegars",
  "sesame oil": "Oils & Vinegars",
  vinegar: "Oils & Vinegars",
  "balsamic vinegar": "Oils & Vinegars",
  "red wine vinegar": "Oils & Vinegars",
  "apple cider vinegar": "Oils & Vinegars",

  // Snacks
  chip: "Snacks",
  cracker: "Snacks",
  pretzel: "Snacks",
  popcorn: "Snacks",
  nut: "Snacks",
  candy: "Snacks",
  chocolate: "Snacks",

  // Beverages
  water: "Beverages",
  soda: "Beverages",
  juice: "Beverages",
  coffee: "Beverages",
  tea: "Beverages",
  wine: "Beverages",
  beer: "Beverages",

  // Baking
  "baking powder": "Baking",
  "baking soda": "Baking",
  yeast: "Baking",
  "vanilla extract": "Baking",
  "chocolate chip": "Baking",
  "cocoa powder": "Baking",

  // Pasta & Rice
  pasta: "Pasta & Rice",
  spaghetti: "Pasta & Rice",
  penne: "Pasta & Rice",
  macaroni: "Pasta & Rice",
  rice: "Pasta & Rice",
  "brown rice": "Pasta & Rice",
  "white rice": "Pasta & Rice",
  quinoa: "Pasta & Rice",
  couscous: "Pasta & Rice",

  // Nuts & Seeds
  almond: "Nuts & Seeds",
  walnut: "Nuts & Seeds",
  pecan: "Nuts & Seeds",
  cashew: "Nuts & Seeds",
  peanut: "Nuts & Seeds",
  "sunflower seed": "Nuts & Seeds",
  "pumpkin seed": "Nuts & Seeds",
  "chia seed": "Nuts & Seeds",
  "flax seed": "Nuts & Seeds",

  // International
  "soy sauce": "International",
  "curry paste": "International",
  "curry powder": "International",
  "fish sauce": "International",
  "hoisin sauce": "International",
  sriracha: "International",
  tahini: "International",
  miso: "International",
  "coconut milk": "International",
};

// Function to guess category based on ingredient name
export function guessIngredientCategory(ingredientName: string): string {
  const lowerName = ingredientName.toLowerCase();

  // Check for exact matches first
  if (INGREDIENT_CATEGORY_MAPPING[lowerName]) {
    return INGREDIENT_CATEGORY_MAPPING[lowerName];
  }

  // Check for partial matches
  for (const [key, category] of Object.entries(INGREDIENT_CATEGORY_MAPPING)) {
    if (lowerName.includes(key)) {
      return category;
    }
  }

  // Default category if no match found
  return "Other";
}
