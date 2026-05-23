// Shared types that match the kafudeal.com data model
// (snake_case from Supabase → camelCase via transformers in transformers.ts)

export type Product = {
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  image: string;
  store: string;          // partner name
  category: string;       // category name
  categoryId?: string;
  partnerId?: string;
  expiryDays: number;
  expiryDate?: string;
  stock: number;
  rating: number;
  sku?: string;
  status?: string;
  // Computed helpers (kept for UI compatibility with the v2 mock shape)
  price: number;          // alias for discountedPrice
  was: number;            // alias for originalPrice
  discount: number;       // alias for discountPercentage
  endsIn: string;         // formatted "8h left" / "Tomorrow" / "2d left"
  urgent: boolean;        // < 24h
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  image?: string;
  count: number;
};

export type Partner = {
  id: string;
  name: string;
  type: string;
  domain?: string;
  initials?: string;
  color?: string;
  bgColor?: string;
  accentColor?: string;
  logoUrls: string[];
  status?: string;
  listedProducts: number;
  activeProducts: number;
};

export type Customer = {
  id: string;
  authUserId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
};

export type CartItem = { product: Product; qty: number };

export type Order = {
  id: string;
  shortId: string;
  status: string;
  createdAt: string;
  total: number;
  itemsCount: number;
  items?: { product: Product; qty: number; price: number }[];
};
