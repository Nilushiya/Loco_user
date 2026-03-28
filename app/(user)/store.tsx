import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../../context/CartContext";

const hero =
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80";

type MenuItem = { id: string; name: string; price: string; rating: string; reviews: string; image: string };
const storeMenus: Record<string, MenuItem[]> = {
  s3: [
    {
      id: "m1",
      name: "Chicken Kottu",
      price: "LKR 990.00",
      rating: "94%",
      reviews: "500+",
      image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70",
    },
    {
      id: "m2",
      name: "Chicken chees Kottu",
      price: "LKR 990.00",
      rating: "94%",
      reviews: "500+",
      image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70",
    },
    {
      id: "m3",
      name: "Roasted Chicken Kottu",
      price: "LKR 990.00",
      rating: "94%",
      reviews: "500+",
      image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70",
    },
    {
      id: "m4",
      name: "Curry Chicken Kottu",
      price: "LKR 990.00",
      rating: "94%",
      reviews: "500+",
      image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70",
    },

  ],
  s1: [
    {
      id: "m4",
      name: "Chicken Fried Rice",
      price: "LKR 780.00",
      rating: "96%",
      reviews: "500+",
      image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
    },
  ],
};

const StoreScreen = () => {
  const router = useRouter();
  const { cart, addItem, removeItem } = useCart();
  const navigation = useNavigation<any>();

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    area?: string;
    q?: string;
    from?: string;
  }>();

  const storeId = (params.id || "").toString();
  const name = params.name || "Restaurant";
  const area = params.area || "Colombo";
  const q = (params.q || "").toString();
  const from = (params.from || "search").toString();

  const menu = storeMenus[storeId] || storeMenus["s1"];

  const getQty = (itemId: string) => {
    if (!cart || cart.storeId !== storeId) return 0;
    const key = `${storeId}-${itemId}`;
    return cart.items[key]?.quantity || 0;
  };

  const handleAdd = (item: { id: string; name: string; price: string; image: string }) => {
    const price = Number(item.price.replace(/[^0-9.]/g, ""));
    addItem(storeId, name, area, { id: item.id, name: item.name, price, image: item.image });
  };

  const handleRemove = (item: { id: string }) => {
    removeItem(storeId, item.id);
  };

  const cartSummary = useMemo(() => {
    if (!cart || cart.storeId !== storeId) return { totalItems: 0, totalAmount: 0 };
    let totalItems = 0;
    let totalAmount = 0;
    Object.values(cart.items).forEach((item) => {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
    });
    return { totalItems, totalAmount };
  }, [cart, storeId]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: hero }} style={styles.hero} />

        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace({
                  pathname: "/(user)/search-results",
                  params: { q, from },
                });
              }
            }}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>
            {name} ({area})
          </Text>

          <Text style={styles.section}>Popular Items</Text>

          {menu.map((item) => {
            const qty = getQty(item.id);

            return (
              <View key={item.id} style={styles.menuCard}>
                <Image source={{ uri: item.image }} style={styles.menuImage} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuPrice}>{item.price}</Text>
                </View>

                {qty > 0 ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => handleRemove(item)}>
                      <Text style={styles.stepText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.qty}>{qty}</Text>

                    <TouchableOpacity onPress={() => handleAdd(item)}>
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAdd(item)}
                  >
                    <Text style={styles.addTxt}>Add +</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {cartSummary.totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={{ color: "#fff" }}>
              {cartSummary.totalItems} Items
            </Text>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              LKR {cartSummary.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() =>
              router.push({
                pathname: "/(user)/cart",
                params: { from: "store", id: storeId, name, area, q, origin: from },
              })
            }
          >
            <Text style={{ fontWeight: "700" }}>View Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default StoreScreen;

const styles = StyleSheet.create({
  hero: { width: "100%", height: 200 },
  topBar: {
    position: "absolute",
    top: 18,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },

  content: { padding: 16 },

  title: { fontSize: 22, fontWeight: "800" },

  subtitle: { color: "#666", marginTop: 4 },

  section: { marginTop: 20, fontWeight: "700" },

  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },

  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
  },

  menuName: { fontWeight: "700" },

  menuPrice: { color: "#444" },

  addBtn: {
    backgroundColor: "#FFE5D1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  addTxt: { fontWeight: "700" },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5D1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  stepText: { fontSize: 18, fontWeight: "700" },

  qty: { marginHorizontal: 10, fontWeight: "700" },

  cartBar: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "#333",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cartBtn: {
    backgroundColor: "#f5c049",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
