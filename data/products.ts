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
};

export const products: Product[] = [
  {
    id: "1",
    name: "Lindt 85% Dark",
    store: "VERIFIED STORE",
    image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&q=80",
    price: 9,
    was: 26,
    discount: 65,
    endsIn: "2d 2h left",
    category: "Snacks",
  },
  {
    id: "2",
    name: "Al Ain Milk 2L",
    store: "VERIFIED STORE",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80",
    price: 8,
    was: 16,
    discount: 50,
    endsIn: "Ends in 8h",
    category: "Dairy",
  },
  {
    id: "3",
    name: "Strawberries 250g",
    store: "VERIFIED STORE",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80",
    price: 6,
    was: 10,
    discount: 40,
    endsIn: "Ends in 8h",
    category: "Fresh",
  },
  {
    id: "4",
    name: "Cheddar Block",
    store: "VERIFIED STORE",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80",
    price: 14,
    was: 20,
    discount: 30,
    endsIn: "5d 2h left",
    category: "Dairy",
  },
  {
    id: "5",
    name: "Artisan Sourdough 600g",
    store: "VERIFIED BAKERY",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    price: 9,
    was: 20,
    discount: 55,
    endsIn: "Tomorrow",
    category: "Bakery",
  },
  {
    id: "6",
    name: "Nivea Moisture Cream 200ml",
    store: "PHARMACY & BEAUTY",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    price: 15,
    was: 28,
    discount: 46,
    endsIn: "3d 2h left",
    category: "Beauty",
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
