export interface SearchResultItem {
  id: string;
  name: string;
  type: "Food" | "Shop";
  tags: string[];
  meta?: string;
  image?: string;
  description?: string;
  categoryName?: string;
  restaurantName?: string;
  restaurantImage?: string;
  latitude?: string;
  longitude?: string;
  price?: number;
  restaurantId: number;
}
