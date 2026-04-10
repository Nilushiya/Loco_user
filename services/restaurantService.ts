import apiClient from "../api/client";

export interface RestaurantItem {
  id: number;
  name: string;
  image: string;
  price: number;
  description: string;
  availability: boolean;
  categoryId: number;
  restaurantId: number;
}

export interface RestaurantItemsResponse {
  success: boolean;
  message: string;
  data: RestaurantItem[];
}

export const restaurantService = {
  async fetchRestaurantItems(restaurantId: number): Promise<RestaurantItemsResponse> {
    const response = await apiClient.get<RestaurantItemsResponse>(`/item/get/restaurant/${restaurantId}`);
    return response.data;
  },
};
