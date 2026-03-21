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
import { saveCart, getCart, clearCart } from "../../utils/cartStorage";
import type { CartItem } from "../../utils/cartStorage";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
  tags: string[];
  available?: boolean;
};

type Store = {
  id: string;
  name: string;
  area: string;
  rating: string;
  reviews: string;
  eta: string;
  fee: string;
  logo: string;
  available?: boolean;
  items: MenuItem[];
  highlight?: string;
};

const stores: Store[] = [
  {
    id: "s1",
    name: "Wok To Walk",
    area: "Kiribathgoda",
    rating: "92.9%",
    reviews: "500+",
    eta: "45 - 55 min",
    fee: "LKR 119.00",
    logo: "https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&fit=crop&w=120&q=80",
    available: true,
    items: [
      {
        id: "m1",
        name: "Chicken Kottu",
        price: "LKR 990.00",
        rating: "94%",
        reviews: "500+",
        image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70?auto=format&fit=crop&w=200&q=80",
        tags: ["kottu", "chicken"],
        available: true,
      },
    ],
  },
  {
    id: "s2",
    name: "Mr. Kottu Grand Restaurant",
    area: "Kiribathgoda",
    rating: "79.8%",
    reviews: "500+",
    eta: "50 - 60 min",
    fee: "LKR 139.00",
    logo: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=120&q=80",
    highlight: "Combo Deal",
    available: false,
    items: [
      {
        id: "m2",
        name: "Roasted Chicken Kottu",
        price: "LKR 1,500.00",
        rating: "72%",
        reviews: "100+",
        image: "https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=200&q=80",
        tags: ["kottu", "chicken"],
        available: false,
      },
      {
        id: "m3",
        name: "Cheese Kottu",
        price: "LKR 1,250.00",
        rating: "80%",
        reviews: "200+",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
        tags: ["kottu", "cheese"],
        available: false,
      },
    ],
  },
  {
    id: "s3",
    name: "Devon Hotel & Bakery",
    area: "Kiribathgoda",
    rating: "92.8%",
    reviews: "500+",
    eta: "45 - 55 min",
    fee: "LKR 99.00",
    logo: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80",
    available: false,
    items: [
      {
        id: "m4",
        name: "Chicken Fried Rice",
        price: "LKR 780.00",
        rating: "96%",
        reviews: "500+",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
        tags: ["rice", "chicken"],
        available: false,
      },
    ],
  },
];

const SearchResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; from?: string }>();
  const keyword = (params.q || "").toString();
  const origin = (params.from || "search").toString();
  const searchTerm = keyword.trim();
  const lower = searchTerm.toLowerCase();
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [toast, setToast] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCart = async () => {
      const stored = await getCart();
      if (stored?.items) {
        setCart(stored.items);
      }
    };
    loadCart();
  }, []);
  
  const goBackSafe = () => {
    console.log("Go back safe triggered. Origin:", origin);
    if (origin === "index") {
      router.replace("/(user)");
      return;
    }

    if (origin === "search") {
      router.replace("/(user)/search");
      return;
    }

    if (router.canGoBack()) {
      console.log("Router can go back, going back.");
      router.back();
      return;
    }

    router.replace("/(user)/search");
  };

  const matches = useMemo(() => {
    if (!searchTerm) return [];
    return stores.filter((store) => {
      const inStore = store.name.toLowerCase().includes(lower);
      const inMenu = store.items.some((item) => {
        const inName = item.name.toLowerCase().includes(lower);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(lower));
        return inName || inTags;
      });
      return inStore || inMenu;
    });
  }, [searchTerm, lower]);

  const getQty = (key: string) => cart[key]?.quantity || 0;

  // const addItem = (key: string, label: string) => {
  //   setCart((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  //   setToast(`${label} has been added to your cart.`);
  //   setTimeout(() => setToast(null), 1500);
  // };
  const addItem = async (store: Store, item: MenuItem) => {
    const key = `${store.id}-${item.id}`;
    const stored = await getCart();

    if (stored && stored.storeId !== store.id) {
      await clearCart();
      setCart({});
    }

    setCart((prev) => {
      const existing = prev[key];
      const price = Number(item.price.replace(/[^0-9.]/g, ""));
      const updated: Record<string, CartItem> = {
        ...prev,
        [key]: {
          id: item.id,
          name: item.name,
          price: isNaN(price) ? 0 : price,
          image: item.image,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };

      saveCart({
        storeId: store.id,
        storeName: store.name,
        storeArea: store.area,
        items: updated,
      });

      return updated;
    });

    setToast(`${item.name} has been added to your cart.`);
    setTimeout(() => setToast(null), 1500);
  };

  const removeItem = async (store: Store, item: MenuItem) => {
    const key = `${store.id}-${item.id}`;
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;

      const updated = { ...prev };
      if (existing.quantity <= 1) {
        delete updated[key];
      } else {
        updated[key] = { ...existing, quantity: existing.quantity - 1 };
      }

      saveCart({
        storeId: store.id,
        storeName: store.name,
        storeArea: store.area,
        items: updated,
      });

      return updated;
    });
  };

  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    Object.values(cart).forEach((item) => {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    });
    return { totalItems, totalAmount };
  }, [cart]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={goBackSafe}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.searchPill}>
          <Ionicons name="search-outline" size={18} color="#444" />
          <Text style={styles.searchText}>{searchTerm || "Search"}</Text>
          {searchTerm.length > 0 && (
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
          Showing results for <Text style={styles.bold}>'{searchTerm}'</Text>
        </Text>

        {matches.length === 0 && (
          <Text style={styles.empty}>No matching shops for this search.</Text>
        )}

        {matches.map((store) => (
          <View key={store.id} style={styles.card}>
            {!store.available && (
              <View style={styles.unavailableBadge}>
                <Ionicons name="ban" size={14} color="#c0392b" />
                <Text style={styles.unavailableText}>Currently Unavailable</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.cardHeader, !store.available && { opacity: 0.5 }]}
              activeOpacity={store.available === false ? 1 : 0.8}
              disabled={store.available === false}
              onPress={() => {
                if (store.available === false) return;
                router.push({
                  pathname: "/(user)/store",
                  params: {
                    id: store.id,
                    name: store.name,
                    area: store.area,
                    q: searchTerm,
                    from: origin,
                  },
                });
              }}
            >
              <Image source={{ uri: store.logo }} style={styles.logo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>
                  {store.name} ({store.area})
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="thumbs-up" size={14} color="#444" />
                  <Text style={styles.metaText}>
                    {" "}
                    {store.rating} ({store.reviews})
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#444"
                    style={{ marginLeft: 10 }}
                  />
                  <Text style={styles.metaText}> {store.eta}</Text>
                  <Text style={[styles.metaText, { marginLeft: 10 }]}>
                    Fee: {store.fee}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>

            {store.highlight && (
              <View style={styles.dealBadge}>
                <Ionicons name="pricetag" size={14} color="#0c7a43" />
                <Text style={styles.dealText}>{store.highlight}</Text>
              </View>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuRowWrap}
            >
              {store.items.map((item) => {
                const key = `${store.id}-${item.id}`;
                const qty = getQty(key);
                const disabled = item.available === false || store.available === false;
                return (
                  <View key={item.id} style={styles.menuCard}>
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.metaText}>{item.price}</Text>
                      <View style={[styles.metaRow, { marginTop: 4 }]}>
                        <Ionicons name="thumbs-up" size={14} color="#444" />
                        <Text style={styles.metaText}>
                          {" "}
                          {item.rating} ({item.reviews})
                        </Text>
                      </View>
                      {!item.available && (
                        <Text style={styles.unavailableText}>Temporarily unavailable</Text>
                      )}
                    </View>
                    {qty > 0 ? (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          onPress={() => removeItem(store, item)}
                          style={styles.stepBtn}
                          disabled={disabled}
                        >
                          <Text style={styles.stepText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          onPress={() => addItem(store, item)}
                          style={styles.stepBtn}
                          disabled={disabled}
                        >
                          <Text style={styles.stepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        disabled={disabled}
                        style={[
                          styles.addButton,
                          disabled && styles.addButtonDisabled,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => addItem(store, item)}
                      >
                        <Text style={styles.addText}>Add +</Text>
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

      {cartSummary.totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartItems}>{cartSummary.totalItems} Items</Text>
            <Text style={styles.cartTotal}>
              LKR {cartSummary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <TouchableOpacity style={styles.cartButton} activeOpacity={0.9}>
            <Text style={styles.cartButtonText}>View cart -></Text>
          </TouchableOpacity>
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
  bold: {
    fontWeight: "700",
  },
  empty: {
    color: "#777",
    fontSize: 14,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  metaText: {
    color: "#555",
    fontSize: 12,
  },
  dealBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0c7a43",
    backgroundColor: "#e7f6ed",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  dealText: {
    marginLeft: 6,
    color: "#0c7a43",
    fontSize: 12,
    fontWeight: "700",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
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
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  itemImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#FFE5D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonDisabled: {
    backgroundColor: "#f1f1f1",
  },
  addText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 12,
  },
  unavailableBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbeaea",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unavailableText: {
    color: "#c0392b",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "700",
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
  cartBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#3b3735",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 6,
  },
  cartItems: {
    color: "#fff",
    fontSize: 12,
  },
  cartTotal: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  cartButton: {
    backgroundColor: "#f5c049",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cartButtonText: {
    fontWeight: "700",
    color: "#111",
  },
});
