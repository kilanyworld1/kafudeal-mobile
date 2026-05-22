export type Product = {
  id: string;
  name: string;
  store: string;
  image: string;
  price: number;
  was: number;
  discount: number;
  endsIn: string;
  category: string;
  urgent?: boolean;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Lindt 85% Dark Chocolate",
    store: "VERIFIED STORE · MARINA",
    image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&q=80",
    price: 9, was: 26, discount: 65,
    endsIn: "8h left", category: "Snacks", urgent: true,
  },
  {
    id: "2",
    name: "Al Ain Milk 2L",
    store: "VERIFIED STORE · JBR",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
    price: 8, was: 16, discount: 50,
    endsIn: "8h left", category: "Dairy", urgent: true,
  },
  {
    id: "3",
    name: "Fresh Strawberries 250g",
    store: "VERIFIED STORE · BARSHA",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80",
    price: 6, was: 10, discount: 40,
    endsIn: "8h left", category: "Fresh", urgent: true,
  },
  {
    id: "4",
    name: "Cheddar Block 400g",
    store: "VERIFIED STORE · MARINA",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80",
    price: 14, was: 20, discount: 30,
    endsIn: "5d 2h left", category: "Dairy",
  },
  {
    id: "5",
    name: "Artisan Sourdough 600g",
    store: "VERIFIED BAKERY · MARINA",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    price: 9, was: 20, discount: 55,
    endsIn: "Tomorrow", category: "Bakery",
  },
  {
    id: "6",
    name: "Nivea Cream 200ml",
    store: "PHARMACY · DOWNTOWN",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    price: 15, was: 28, discount: 46,
    endsIn: "3d left", category: "Beauty",
  },
  {
    id: "7",
    name: "Croissants Pack of 6",
    store: "VERIFIED BAKERY · JLT",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
    price: 12, was: 22, discount: 45,
    endsIn: "Tomorrow", category: "Bakery",
  },
  {
    id: "8",
    name: "Greek Yogurt 500g",
    store: "VERIFIED STORE · MARINA",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    price: 7, was: 14, discount: 50,
    endsIn: "2d left", category: "Dairy",
  },
  {
    id: "9",
    name: "Organic Spinach 200g",
    store: "VERIFIED STORE · BARSHA",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80",
    price: 5, was: 9, discount: 44,
    endsIn: "12h left", category: "Fresh", urgent: true,
  },
  {
    id: "10",
    name: "L'Oréal Shampoo 400ml",
    store: "PHARMACY · MARINA",
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&q=80",
    price: 18, was: 32, discount: 44,
    endsIn: "6d left", category: "Beauty",
  },
  {
    id: "11",
    name: "Belgian Pralines Box",
    store: "VERIFIED STORE · DOWNTOWN",
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&q=80",
    price: 22, was: 45, discount: 51,
    endsIn: "4d left", category: "Snacks",
  },
  {
    id: "12",
    name: "Avocado Pack of 4",
    store: "VERIFIED STORE · JBR",
    image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80",
    price: 11, was: 18, discount: 39,
    endsIn: "2d left", category: "Fresh",
  },
];

export const categories = [
  { key: "snacks", label: "Snacks", emoji: "🍫", tint: "#FFE7D1", tag: "−70%", hot: true },
  { key: "fresh", label: "Fresh", emoji: "🥬", tint: "#E5F4DE", tag: "Fast" },
  { key: "bakery", label: "Bakery", emoji: "🥖", tint: "#FFF1D6" },
  { key: "beauty", label: "Beauty", emoji: "💄", tint: "#FBEAF0" },
  { key: "dairy", label: "Dairy", emoji: "🥛", tint: "#EAF3FF" },
  { key: "drinks", label: "Drinks", emoji: "🥤", tint: "#FFE7D1" },
  { key: "frozen", label: "Frozen", emoji: "🧊", tint: "#E5F4DE" },
];

// Curated sections for Home horizontal scrollers
export const endingSoon = products.filter((p) => p.urgent);
export const topDeals = [...products].sort((a, b) => b.discount - a.discount).slice(0, 6);
export const freshAndBakery = products.filter((p) => p.category === "Fresh" || p.category === "Bakery");
export const beautyDeals = products.filter((p) => p.category === "Beauty" || p.category === "Snacks").slice(0, 6);
