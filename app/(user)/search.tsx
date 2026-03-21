import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const recentSearches = [
  "Kottu",
  "Pizza Hut",
  "Pizza Hut Kiribathkoda",
  "Pizza",
  "Ramazan",
];

const categories = [
  {
    id: "1",
    name: "Ramazan",
    image:
      "https://images.unsplash.com/photo-1610186594416-2f5b7bbfe6af?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "2",
    name: "Chinese",
    image:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "3",
    name: "Indian",
    image:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "4",
    name: "Kottu",
    image:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "5",
    name: "Rice & Curry",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "6",
    name: "Burgers",
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "7",
    name: "Shawarma",
    image:
      "https://images.unsplash.com/photo-1625944527639-c8a62c2b2f43?auto=format&fit=crop&w=120&q=80",
  },
  {
    id: "8",
    name: "Desserts",
    image:
      "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=120&q=80",
  },
];

const stores = [
  {
    id: "s1",
    name: "Wok To Walk",
    area: "Kiribathgoda",
    rating: "92.9%",
    reviews: "500+",
    eta: "45 - 55 min",
    fee: "LKR 119.00",
    logo: "https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&fit=crop&w=120&q=80",
    items: [
      {
        id: "m1",
        name: "Chicken Kottu",
        price: "LKR 990.00",
        rating: "94%",
        reviews: "500+",
        image: "https://images.unsplash.com/photo-1622396481228-34b4c4b29f70?auto=format&fit=crop&w=200&q=80",
        tags: ["kottu", "chicken"],
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
    items: [
      {
        id: "m2",
        name: "Roasted Chicken Kottu",
        price: "LKR 1,500.00",
        rating: "72%",
        reviews: "100+",
        image: "https://images.unsplash.com/photo-1481931098730-318b6f776db0?auto=format&fit=crop&w=200&q=80",
        tags: ["kottu", "chicken"],
      },
      {
        id: "m3",
        name: "Cheese Kottu",
        price: "LKR 1,250.00",
        rating: "80%",
        reviews: "200+",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80",
        tags: ["kottu", "cheese"],
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

const searchPool = [
  ...stores.map((store) => ({
    id: `store-${store.id}`,
    name: store.name,
    type: "Shop" as const,
    tags: [store.area, ...store.items.flatMap((i) => i.tags)],
  })),
  ...stores.flatMap((store) =>
    store.items.map((item) => ({
      id: `item-${item.id}`,
      name: item.name,
      type: "Food" as const,
      tags: item.tags,
    }))
  ),
];

const SearchScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const goBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // router.push("/(user)");
    }
  };

  const goToResults = (text?: string) => {
    const keyword = (text ?? query).trim();
    if (!keyword) return;
    router.push({
      pathname: "/(user)/search-results",
      params: { q: keyword, from: "search" },
    });
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return searchPool.filter((item) => {
      const inName = item.name.toLowerCase().includes(lower);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(lower));
      return inName || inTags;
    });
  }, [query]);

  const handleResultPress = (name: string) => {
    setSelected(name);
    setQuery(name);
    goToResults(name);
  };

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
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Search for food"
            placeholderTextColor="#999"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => goToResults()}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setSelected(null);
              }}
              style={styles.clearButton}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {query.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            {filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>No matches found</Text>
            ) : (
              filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.resultCard,
                    selected === item.name && styles.resultCardSelected,
                  ]}
                  onPress={() => handleResultPress(item.name)}
                >
                  <View style={styles.resultIconWrap}>
                    <Ionicons
                      name={item.type === "Shop" ? "business-outline" : "fast-food-outline"}
                      size={20}
                      color="#FF7A00"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultMeta}>
                      {item.type} • {item.tags.join(", ")}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#999"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.chipWrap}>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.chip}
                    onPress={() => {
                      setQuery(term);
                      setSelected(term);
                      goToResults(term);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="time-outline" size={16} color="#444" />
                    <Text style={styles.chipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Categories</Text>
              <FlatList
                data={categories}
                numColumns={4}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                columnWrapperStyle={{ justifyContent: "space-between" }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryCard}
                    onPress={() => {
                      setQuery(item.name);
                      setSelected(item.name);
                      goToResults(item.name);
                    }}
                  >
                    <Image source={{ uri: item.image }} style={styles.categoryImage} />
                    <Text style={styles.categoryText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 12,
    padding: 6,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#eee",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111",
  },
  clearButton: {
    marginLeft: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    marginRight: 10,
    marginBottom: 10,
  },
  chipText: {
    marginLeft: 6,
    color: "#333",
    fontWeight: "600",
  },
  categoryCard: {
    alignItems: "center",
    marginBottom: 16,
    width: "23%",
  },
  categoryImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  categoryText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  resultCardSelected: {
    borderColor: "#FF7A00",
    backgroundColor: "#fff7f1",
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFE5D1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  resultMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
