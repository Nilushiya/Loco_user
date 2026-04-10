import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { useSearchItems } from "../../hooks/useSearchItems";
import { useCart } from "../../context/CartContext";
import { SearchResultItem } from "../../types/search";

const SearchResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; from?: string }>();
  const keyword = (params.q || "").toString().trim();
  const origin = (params.from || "search").toString();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { results, loading, error } = useSearchItems({
    query: keyword,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
  });
  const { cart: cartData, addItem: addToCart, removeItem } = useCart();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          if (active) {
            setLocationError(
              "Enable location access to surface relevant restaurants."
            );
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!active) return;
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      } catch (err) {
        if (active) {
          setLocationError(
            "We could not resolve your GPS location. Try again in a moment."
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const groupedRestaurants = useMemo(() => {
    const map = new Map<
      number,
      {
        restaurantId: number;
        restaurantName: string;
        restaurantImage?: string;
        items: SearchResultItem[];
      }
    >();
    results.forEach((result) => {
      const current = map.get(result.restaurantId);
      if (current) {
        current.items.push(result);
      } else {
        map.set(result.restaurantId, {
          restaurantId: result.restaurantId,
          restaurantName: result.restaurantName ?? "Restaurant",
          restaurantImage: result.restaurantImage,
          items: [result],
        });
      }
    });
    return Array.from(map.values());
  }, [results]);

  const getQty = (restaurantId: number, itemId: string) => {
    const key = `${restaurantId}-${itemId}`;
    return cartData?.items[key]?.quantity || 0;
  };

  const handleAdd = (
    restaurantId: number,
    restaurantName: string,
    item: SearchResultItem
  ) => {
    const price = item.price ?? 0;
    addToCart(String(restaurantId), restaurantName, item.categoryName ?? "Unknown", {
      id: item.id,
      name: item.name,
      price,
      image: item.image?? "https://images.unsplash.com/photo-1528715471579-d1b1f5ca77b0?auto=format&fit=crop&w=120&q=80",
    });
    setToast(`${item.name} has been added to your cart.`);
    setTimeout(() => setToast(null), 1600);
  };

  const handleRemove = (restaurantId: number, itemId: string) => {
    removeItem(String(restaurantId), itemId);
  };

  const goBackSafe = () => {
    if (origin === "index") {
      router.replace("/(user)");
      return;
    }
    if (origin === "search") {
      router.replace("/(user)/search");
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(user)/search");
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBackSafe} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.searchPill}>
          <Ionicons name="search-outline" size={18} color="#444" />
          <Text style={styles.searchText}>{keyword || "Search"}</Text>
          {keyword && (
            <TouchableOpacity
              onPress={() => router.replace("/(user)/search")}
              style={styles.clearButton}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={18} color="#777" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.resultLabel}>
          Showing results for <Text style={styles.bold}>'{keyword}'</Text>
        </Text>
        {!coords && !locationError && (
          <Text style={styles.helperText}>Acquiring your location…</Text>
        )}
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {loading && (
          <Text style={styles.helperText}>Searching restaurants…</Text>
        )}
        {!loading && !groupedRestaurants.length && !error && (
          <Text style={styles.empty}>No matching shops for this search.</Text>
        )}

        {groupedRestaurants.map((restaurant) => (
          <View key={restaurant.restaurantId} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() =>
                router.push({
                  pathname: "/(user)/restaurant-items",
                  params: {
                    restaurantId: restaurant.restaurantId,
                    restaurantName: restaurant.restaurantName,
                  },
                })
              }
            >
              <Image
                source={{
                  uri:
                    restaurant.restaurantImage ??
                    "https://images.unsplash.com/photo-1528715471579-d1b1f5ca77b0?auto=format&fit=crop&w=120&q=80",
                }}
                style={styles.logo}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{restaurant.restaurantName}</Text>
                <Text style={styles.metaText}>
                  {restaurant.items.length} item{restaurant.items.length > 1 ? "s" : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuRowWrap}
            >
              {restaurant.items.map((item) => {
                const qty = getQty(restaurant.restaurantId, item.id);
                const disabled = !!error;
                return (
                  <View key={item.id} style={styles.menuCard}>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.metaText}>{item.description}</Text>
                    </View>
                    {qty > 0 ? (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          onPress={() => handleRemove(restaurant.restaurantId, item.id)}
                          style={styles.stepBtn}
                          disabled={disabled}
                        >
                          <Text style={styles.stepText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleAdd(
                              restaurant.restaurantId,
                              restaurant.restaurantName,
                              item
                            )
                          }
                          style={styles.stepBtn}
                          disabled={disabled}
                        >
                          <Text style={styles.stepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        disabled={disabled}
                        style={[styles.addButton, disabled && styles.addButtonDisabled]}
                        activeOpacity={0.8}
                        onPress={() =>
                          handleAdd(
                            restaurant.restaurantId,
                            restaurant.restaurantName,
                            item
                          )
                        }
                      >
                        <Text style={styles.addText}>Add +</Text>
                        <Text style={styles.priceText}>
                          {item.meta ?? "Price"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
};

export default SearchResultsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 12,
    padding: 6,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#ededed",
  },
  searchText: {
    flex: 1,
    marginLeft: 8,
    color: "#111",
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  resultLabel: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 15,
    color: "#444",
  },
  helperText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#c62828",
    marginBottom: 6,
  },
  empty: {
    color: "#777",
    fontSize: 14,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  metaText: {
    color: "#555",
    fontSize: 12,
  },
  menuRowWrap: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingRight: 6,
  },
  menuCard: {
    width: 260,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  itemImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  addButton: {
    backgroundColor: "#FFE5D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#f1f1f1",
  },
  addText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 12,
  },
  priceText: {
    fontSize: 12,
    color: "#444",
    marginTop: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5D1",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f5c49c",
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stepText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  qtyText: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: "700",
    color: "#111",
  },
  toast: {
    position: "absolute",
    top: 10,
    left: 16,
    right: 16,
    backgroundColor: "#2d9b4e",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    flex: 1,
  },
});
