import apiClient from "../api/client";

export interface SearchApiResult {
  itemId: number;
  itemName: string;
  itemImage: string;
  itemDescription: string;
  itemPrice: number;
  categoryName: string;
  restaurantId: number;
  restaurantName: string;
  restaurantImage: string;
  latitude: string;
  longitude: string;
}

export interface SearchApiResponse {
  total: number;
  results: SearchApiResult[];
}

export interface SearchQueryParams {
  q: string;
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

export const searchService = {
  async searchItems(params: SearchQueryParams): Promise<SearchApiResponse> {
    const response = await apiClient.get<SearchApiResponse>("/search", {
      params,
      timeout: 15000,
    });
    return response.data;
  },
};
