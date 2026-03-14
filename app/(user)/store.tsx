import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const hero =
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80";

const storeMenus: Record<string, { id: string; name: string; price: string; rating: string; image: string; }[]> = {
  s1: [
    {
      id: "m1",
      name: "Chicken Kottu",
      price: "LKR 990.00",
      rating: "94% (500+)",
      image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "m1b",
      name: "Spicy Mixed Kottu",
      price: "LKR 1,150.00",
      rating: "90% (300+)",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
    },
  ],
  s2: [
    {
      id: "m2",
      name: "Roasted Chicken Kottu",
      price: "LKR 1,500.00",
      rating: "72% (100+)",
      image: "https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "m3",
      name: "Cheese Kottu",
      price: "LKR 1,250.00",
      rating: "80% (200+)",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
    },
  ],
  s3: [
    {
      id: "m4",
      name: "Chicken Fried Rice",
      price: "LKR 780.00",
      rating: "96% (500+)",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
    },
  ],
};

const StoreScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; area?: string }>();
  const storeId = (params.id || "").toString();
  const name = params.name || "Restaurant";
  const area = params.area || "Colombo";
  const menu = storeMenus[storeId] || storeMenus["s1"];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: hero }} style={styles.hero} />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="heart-outline" size={20} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="share-social-outline" size={20} color="#111" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.status}>Open</Text>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>{name} ({area})</Text>

          <View style={styles.metaRow}>
            <Ionicons name="bicycle" size={16} color="#444" />
            <Text style={styles.metaText}> Delivery</Text>
            <Ionicons name="walk-outline" size={16} color="#444" style={{ marginLeft: 12 }} />
            <Text style={styles.metaText}> Self Pickup</Text>
          </View>
          <View style={[styles.metaRow, { marginTop: 6 }]}>
            <Ionicons name="time-outline" size={16} color="#444" />
            <Text style={styles.metaText}> 45min - 55min</Text>
            <Ionicons name="thumbs-up" size={16} color="#444" style={{ marginLeft: 12 }} />
            <Text style={styles.metaText}> 89% (500+)</Text>
            <Text style={[styles.metaText, { marginLeft: 12 }]}>Fee: LKR 239.00</Text>
          </View>

          <Text style={[styles.subtitle, { marginTop: 18, fontWeight: "700", color: "#111" }]}>
            Popular Items
          </Text>
          <View style={styles.menuList}>
            {menu.map((item) => (
              <View key={item.id} style={styles.menuCard}>
                <Image source={{ uri: item.image }} style={styles.menuImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.menuPrice}>{item.price}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="thumbs-up" size={14} color="#444" />
                    <Text style={styles.metaText}> {item.rating}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
                  <Text style={styles.addTxt}>Add +</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StoreScreen;

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: 200,
  },
  topBar: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBtn: {
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  status: {
    color: "#0c7a43",
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
  },
  subtitle: {
    color: "#666",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  metaText: {
    color: "#444",
    fontSize: 13,
  },
  menuList: {
    paddingVertical: 12,
    gap: 10,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  menuImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
    marginRight: 10,
  },
  menuName: {
    fontWeight: "700",
    color: "#111",
  },
  menuPrice: {
    color: "#444",
  },
  addBtn: {
    marginTop: 10,
    backgroundColor: "#FFE5D1",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  addTxt: {
    fontWeight: "700",
    color: "#111",
  },
});
