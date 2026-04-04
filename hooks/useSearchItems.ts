import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { searchPending, searchSuccess, searchFailure, clearSearch } from "../redux/slices/searchSlice";
import { searchService, SearchApiResult } from "../services/searchService";
import { SearchResultItem } from "../types/search";

export interface UseSearchItemsOptions {
  query: string;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  limit?: number;
  offset?: number;
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 400;

const mapApiResult = (result: SearchApiResult): SearchResultItem => ({
  id: `${result.itemId}-${result.restaurantId}`,
  name: result.itemName,
  type: "Food",
  tags: [
    result.categoryName,
    result.restaurantName,
    result.itemDescription,
  ]
    .filter(Boolean)
    .map((tag) => tag?.toString() ?? "")
    .slice(0, 4),
  meta: `LKR ${result.itemPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`,
  image: result.itemImage,
  description: result.itemDescription,
  categoryName: result.categoryName,
  restaurantName: result.restaurantName,
  restaurantImage: result.restaurantImage,
  latitude: result.latitude,
  longitude: result.longitude,
  price: result.itemPrice,
  restaurantId: result.restaurantId,
});

export const useSearchItems = ({
  query,
  latitude,
  longitude,
  radius = 10,
  limit = 20,
  offset = 0,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseSearchItemsOptions) => {
  const dispatch = useAppDispatch();
  const searchState = useAppSelector((state) => state.search);
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  const lastRequestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, debounceMs);
    return () => {
      clearTimeout(handler);
    };
  }, [query, debounceMs]);

  useEffect(() => {
    if (!debouncedQuery) {
      lastRequestKeyRef.current = null;
      dispatch(clearSearch());
      return;
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return;
    }

    const requestKey = `${debouncedQuery}-${latitude}-${longitude}-${radius}-${limit}-${offset}`;
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;
    dispatch(searchPending({ requestKey }));

    searchService
      .searchItems({
        q: debouncedQuery,
        latitude,
        longitude,
        radius,
        limit,
        offset,
      })
      .then((response) => {
        const mapped = response.results.map(mapApiResult);
        dispatch(
          searchSuccess({
            requestKey,
            results: mapped,
            total: response.total,
          })
        );
      })
      .catch((error) => {
        const normalizedError = error as any;
        const message =
          normalizedError?.response?.data?.message ??
          normalizedError?.message ??
          "Unable to fetch search results.";
        dispatch(
          searchFailure({
            requestKey,
            error: message,
          })
        );
      });
  }, [debouncedQuery, latitude, longitude, radius, limit, offset, dispatch]);

  return {
    results: searchState.results,
    total: searchState.total,
    loading: searchState.loading,
    error: searchState.error,
    queryKey: searchState.requestKey,
  };
};
