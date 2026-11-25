// The menu: every ingredient, what it needs to become servable, and the five
// dishes on the board. An ingredient is "ready" when it needs no cooking, or
// after its station finishes it; raw items can never go on a plate.
export const INGREDIENTS = {
  bun: { name: 'Bun', cook: null, color: '#e8b25a', dark: '#c98f2e', price: 0 },
  patty: { name: 'Patty', cook: 'grill', cookSeconds: 4, color: '#8a5a3b', dark: '#5f3a22', price: 0 },
  sausage: { name: 'Sausage', cook: 'grill', cookSeconds: 3.5, color: '#a85b32', dark: '#7c3f1e', price: 0 },
  cheese: { name: 'Cheese', cook: null, color: '#f7c948', dark: '#d9a41f', price: 0 },
  lettuce: { name: 'Lettuce', cook: null, color: '#7bc950', dark: '#4e9a2e', price: 0 },
  tomato: { name: 'Tomato', cook: null, color: '#e4572e', dark: '#b23a1a', price: 0 },
  onion: { name: 'Onion', cook: null, color: '#c9a7d8', dark: '#9a6fb0', price: 0 },
  potato: { name: 'Potato', cook: 'fryer', cookSeconds: 4, color: '#f2d492', dark: '#c9a44e', price: 0 },
};

// A cooked item keeps its base id plus a state: 'raw' | 'cooking' | 'ready' | 'burnt'.
export const COOKED_NAME = { patty: 'Grilled Patty', sausage: 'Grilled Sausage', potato: 'Golden Fries' };
export const BURN_SECONDS = 5; // grace after done before the item burns

export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', price: 8, items: ['bun', 'patty', 'lettuce'] },
  { id: 'cheese', name: 'Cheese Burger', price: 11, items: ['bun', 'patty', 'cheese', 'tomato'] },
  { id: 'salad', name: 'Garden Salad', price: 7, items: ['lettuce', 'tomato', 'onion'] },
  { id: 'hotdog', name: 'Hot Dog', price: 9, items: ['bun', 'sausage', 'onion'] },
  { id: 'fries', name: 'Loaded Fries', price: 8, items: ['potato', 'cheese'] },
];

export const BINS = ['bun', 'patty', 'sausage', 'cheese', 'lettuce', 'tomato', 'onion', 'potato'];

export function recipeById(id) {
  return RECIPES.find((recipe) => recipe.id === id) ?? null;
}

// True when the plate's items are exactly the recipe's, in any order.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.items.length) return false;
  const wanted = [...recipe.items].sort();
  const have = [...plateItems].sort();
  return wanted.every((item, index) => item === have[index]);
}

// The first recipe an order board can ask for that this plate could still become.
export function plateCouldBecome(plateItems, recipe) {
  if (plateItems.length > recipe.items.length) return false;
  const pool = [...recipe.items];
  for (const item of plateItems) {
    const at = pool.indexOf(item);
    if (at === -1) return false;
    pool.splice(at, 1);
  }
  return true;
}
