// The Juan Carlo catering dish catalog. Shared by the contract menu builder and
// the menu-tasting booking form so both offer the same real dishes.

export interface MenuOption {
  name: string;
  cost: number;
}

export interface MenuCategory {
  name: string;
  options: MenuOption[];
}

export const MENU_CATEGORIES: Record<string, MenuCategory> = {
  beef: {
    name: 'Beef',
    options: [
      { name: 'Beef Caldereta', cost: 0 },
      { name: 'Beef Steak', cost: 0 },
      { name: 'Beef Broccoli', cost: 0 },
      { name: 'Beef Salpicao', cost: 0 },
    ]
  },
  pork: {
    name: 'Pork',
    options: [
      { name: 'Pork Humba', cost: 0 },
      { name: 'Pork BBQ', cost: 0 },
      { name: 'Lechon Kawali', cost: 0 },
      { name: 'Pork Liempo', cost: 0 },
    ]
  },
  chicken: {
    name: 'Chicken',
    options: [
      { name: 'Fried Chicken', cost: 0 },
      { name: 'Chicken Curry', cost: 0 },
      { name: 'Chicken Afritada', cost: 0 },
      { name: 'Buttered Chicken', cost: 0 },
    ]
  },
  fish: {
    name: 'Fish',
    options: [
      { name: 'Fish Fillet', cost: 0 },
      { name: 'Sweet & Sour Fish', cost: 0 },
      { name: 'Escabeche', cost: 0 },
      { name: 'Grilled Fish', cost: 0 },
    ]
  },
  seafood: {
    name: 'Seafood',
    options: [
      { name: 'Shrimp Tempura', cost: 150 },
      { name: 'Garlic Butter Shrimp', cost: 150 },
      { name: 'Calamares', cost: 100 },
      { name: 'Baked Mussels', cost: 100 },
    ]
  },
  pasta: {
    name: 'Pasta',
    options: [
      { name: 'Carbonara', cost: 0 },
      { name: 'Spaghetti', cost: 0 },
      { name: 'Pesto Pasta', cost: 0 },
      { name: 'Baked Macaroni', cost: 0 },
    ]
  },
  vegetables: {
    name: 'Vegetables',
    options: [
      { name: 'Chopsuey', cost: 0 },
      { name: 'Buttered Vegetables', cost: 0 },
      { name: 'Pinakbet', cost: 0 },
      { name: 'Lumpiang Shanghai', cost: 50 },
    ]
  },
  rice: {
    name: 'Rice',
    options: [
      { name: 'Steamed Rice', cost: 0 },
      { name: 'Garlic Rice', cost: 0 },
      { name: 'Yang Chow Fried Rice', cost: 50 },
      { name: 'Paella', cost: 95 },
    ]
  },
  dessert: {
    name: 'Dessert',
    options: [
      { name: 'Fruit Salad', cost: 0 },
      { name: 'Leche Flan', cost: 0 },
      { name: 'Buko Pandan', cost: 0 },
      { name: 'Mango Float', cost: 50 },
      { name: 'Chocolate Cake', cost: 75 },
    ]
  },
  drinks: {
    name: 'Drinks',
    options: [
      { name: 'Iced Tea', cost: 0 },
      { name: 'Lemonade', cost: 0 },
      { name: 'Blue Lemonade', cost: 0 },
      { name: 'Mango Juice', cost: 30 },
    ]
  },
};

// Display order for the catalog categories.
export const MENU_CATEGORY_ORDER = [
  'beef', 'pork', 'chicken', 'fish', 'seafood',
  'pasta', 'vegetables', 'rice', 'dessert', 'drinks',
] as const;
