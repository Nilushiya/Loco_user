import { useRouter, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRestaurantItems } from "../../hooks/useRestaurantItems";
import { useCart } from "../../context/CartContext";
import { BASE_URL } from "../../constants/Config";
import { RestaurantItem } from "../../services/restaurantService";

const RestaurantItemsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    restaurantId?: string;
    restaurantName?: string;
  }>();
  const restaurantId = Number(params.restaurantId);
  const restaurantName = params.restaurantName ?? "Restaurant";
  const { items, loading, error } = useRestaurantItems(restaurantId);
  const { cart, addItem, removeItem, clearAll } = useCart();

  const buildImageUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE_URL}/uploads/${path}`;
  };

  const heroImage =
    items[0]?.image && items[0].image.trim().length
      ? buildImageUrl(items[0].image)
      : "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=80";
  const defaultItemImage =
    "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=60";

  const storeId = restaurantId ? String(restaurantId) : "0";

  const handleAdd = async (item: RestaurantItem) => {
    const isDifferentStore = cart && cart.storeId && cart.storeId !== storeId;
    if (isDifferentStore) {
      Alert.alert(
        "Cart Reset",
        "Adding items from a new restaurant will replace the current cart."
      );
      await clearAll();
    }

    addItem(storeId, restaurantName, "Unknown Area", {
      id: String(item.id),
      name: item.name,
      price: item.price,
      image: item.image || "",
    });
  };

  const handleRemove = (itemId: number) => {
    removeItem(storeId, String(itemId));
  };

  const getQty = (itemId: number) => {
    if (!cart || cart.storeId !== String(restaurantId)) return 0;
    const key = `${cart.storeId}-${itemId}`;
    return cart.items[key]?.quantity ?? 0;
  };

  const cartItemsArray = React.useMemo(
    () => (cart && cart.items ? Object.values(cart.items) : []),
    [cart]
  );

  const cartItemCount = React.useMemo(
    () => cartItemsArray.reduce((sum, item) => sum + item.quantity, 0),
    [cartItemsArray]
  );

  const cartTotal = React.useMemo(
    () => cartItemsArray.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItemsArray]
  );

  const handleViewCart = () => {
    router.push("/(user)/cart");
  };

  const headerContent = (
    <>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
      <View style={styles.infoSection}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Open</Text>
          <Text style={styles.deliveryLabel}>Delivery · Self Pickup</Text>
        </View>
        <Text style={styles.title}>{restaurantName}</Text>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color="#555" />
          <Text style={styles.detailText}>46 - 56 min</Text>
          <Ionicons
            name="thumbs-up-outline"
            size={14}
            color="#555"
            style={{ marginLeft: 12 }}
          />
          <Text style={styles.detailText}>95% (500+)</Text>
          <Text style={[styles.detailText, { marginLeft: 12 }]}>
            Fee: LKR 99.00
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeader}>
        <Ionicons name="ios-search-outline" size={18} />
        <Text style={styles.sectionHeaderText}>
          {" "}
          Showing {items.length} item{items.length === 1 ? "" : "s"}
        </Text>
      </Text>

      {loading && (
        <View style={styles.helperRow}>
          <ActivityIndicator size="small" color="#FF7A00" />
          <Text style={styles.helperText}>Loading items…</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.topBarActions}>
          <Ionicons name="heart-outline" size={24} color="#111" />
          <Ionicons name="share-social-outline" size={24} color="#111" />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={headerContent}
        renderItem={({ item }) => {
          const qty = getQty(item.id);
          const imageUri = buildImageUrl(item.image);
          return (
            <View style={styles.itemCard}>
              <Image
                source={{ uri: imageUri || defaultItemImage }}
                style={styles.itemThumb}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.price}>LKR {item.price.toFixed(2)}</Text>
                <View style={styles.metaRow}>
                  <Ionicons
                    name={item.availability ? "checkmark-circle" : "ban"}
                    size={16}
                    color={item.availability ? "#0c7a43" : "#c62828"}
                  />
                  <Text style={styles.availability}>
                    {item.availability ? "Available" : "Unavailable"}
                  </Text>
                </View>
              </View>
              {qty > 0 ? (
                <View style={styles.stepper}>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.id)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity
                    onPress={() => handleAdd(item)}
                    style={styles.stepBtn}
                  >
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAdd(item)}
                >
                  <Text style={styles.addBtnText}>Add +</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
      {cartItemCount > 0 && (
        <View style={styles.toastWrapper} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.toastCard}
            activeOpacity={0.9}
            onPress={handleViewCart}
          >
            <View style={styles.toastText}>
              <Text style={styles.toastTitle}>
                {cartItemCount} item{cartItemCount === 1 ? "" : "s"} · LKR{" "}
                {cartTotal.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.toastSubtitle}>View cart</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF7A00" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default RestaurantItemsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  topBarActions: {
    flexDirection: "row",
    gap: 16,
  },
  heroImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  statusLabel: {
    color: "#4CAF50",
    fontWeight: "700",
    marginRight: 12,
  },
  deliveryLabel: {
    fontSize: 12,
    color: "#555",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontWeight: "700",
    fontSize: 16,
  },
  sectionHeaderText: {
    fontWeight: "700",
    fontSize: 16,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  helperText: {
    marginLeft: 6,
    color: "#555",
    fontSize: 13,
  },
  errorText: {
    color: "#c62828",
    fontSize: 13,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  list: {
    paddingBottom: 140,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemDescription: {
    fontSize: 12,
    color: "#666",
    marginVertical: 4,
  },
  price: {
    fontWeight: "700",
  },
  itemThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  availability: {
    fontSize: 12,
    color: "#555",
    marginLeft: 6,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffaf1",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f7d8b0",
    paddingHorizontal: 6,
  },
  stepBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#bf6b06",
  },
  qtyText: {
    marginHorizontal: 4,
    fontWeight: "700",
    color: "#bf6b06",
  },
  addBtn: {
    backgroundColor: "#fff2da",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ffd28c",
  },
  addBtnText: {
    color: "#bf6b06",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f1f1",
    marginVertical: 14,
  },
  toastWrapper: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toastCard: {
    width: "92%",
    backgroundColor: "#ffd38c",
    borderWidth: 1,
    borderColor: "#FF7A00",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  toastSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
