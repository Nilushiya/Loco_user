import { useEffect, useState } from "react";
import { restaurantService, RestaurantItem } from "../services/restaurantService";

export const useRestaurantItems = (restaurantId?: number) => {
  const [items, setItems] = useState<RestaurantItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) {
      setItems([]);
      setError(null);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    restaurantService
      .fetchRestaurantItems(restaurantId)
      .then((response) => {
        if (!isActive) return;
        setItems(response.data);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(
          err?.response?.data?.message ??
            err?.message ??
            "Unable to load restaurant items."
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [restaurantId]);

  return { items, loading, error };
};
