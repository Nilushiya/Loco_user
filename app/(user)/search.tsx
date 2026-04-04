import React, { useMemo, useState, useEffect } from "react";
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
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useAppSelector } from "../../redux/hooks";
import { useSearchItems } from "../../hooks/useSearchItems";
import axios from "axios";
import { BASE_URL } from "@/constants/Config";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

const recentSearches = [
  "Kottu",
  "Pizza Hut",
  "Pizza Hut Kiribathkoda",
  "Pizza",
  "Ramazan",
];

const staticCategories = [
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



const resolveCategoryName = (category: any) =>
  category?.name ?? category?.category ?? category?.title ?? "Category";

const resolveCategoryImage = (category: any) =>
  category?.image ??
  category?.photo ??
  category?.thumbnail ??
  "https://images.unsplash.com/photo-1528715471579-d1b1f5ca77b0?auto=format&fit=crop&w=120&q=80";

const normalizeCategoryPayload = (payload: any) => {
  if (!payload) return [];
  const candidates = [
    payload,
    payload.data,
    payload.categories,
    payload.categoryItems,
    payload.items,
    payload.result,
    payload.payload,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const SearchScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [fetchedCategories, setFetchedCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const token = useAppSelector((state) => state.auth.token);
  const { results, loading, error: searchError } = useSearchItems({
    query,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          if (active) {
            setLocationError(
              "Enable location access for nearby results and recommendations."
            );
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!active) return;
        setLocationError(null);
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (err) {
        if (active) {
          console.warn("Unable to resolve location for search", err);
          setLocationError(
            "We couldn't read your location right now. Try again later."
          );
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);
  const hasLocation = Boolean(coords);
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

  const displayCategories =
    fetchedCategories.length > 0 ? fetchedCategories : staticCategories;

  const popularCategories = useMemo(() => {
    const popular = displayCategories.filter(
      (cat) =>
        (cat?.popular ?? cat?.isPopular ?? cat?.metadata?.popular ?? false) ===
        true
    );
    if (popular.length > 0) {
      return popular.slice(0, 8);
    }
    return displayCategories.slice(0, 8);
  }, [displayCategories]);

  useEffect(() => {
    if (!token) {
      setFetchedCategories([]);
      return;
    }

    let isMounted = true;
    const loadCategories = async () => {
      setLoadingCategories(true);
      setCategoryError(null);
      try {
        const response = await apiClient.get("/api/categoryItems");
        if (!isMounted) return;
        setFetchedCategories(normalizeCategoryPayload(response.data));
      } catch (error) {
        if (!isMounted) return;
        console.warn("Unable to fetch categories", error);
        setCategoryError("Unable to load categories right now.");
      } finally {
        if (isMounted) {
          setLoadingCategories(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [token]);

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
            {locationError ? (
              <Text style={styles.categoryError}>{locationError}</Text>
            ) : !hasLocation ? (
              <Text style={styles.categoryMetaText}>
                Acquiring your location...
              </Text>
            ) : null}
            {searchError && (
              <Text style={styles.categoryError}>{searchError}</Text>
            )}
            {loading && (
              <Text style={styles.categoryMetaText}>Searching...</Text>
            )}
            {!loading && hasLocation && results.length === 0 && !searchError && (
              <Text style={styles.emptyText}>No matches found</Text>
            )}
            {!loading &&
              hasLocation &&
              !searchError &&
              results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.resultCard,
                    selected === item.name && styles.resultCardSelected,
                  ]}
                  onPress={() => handleResultPress(item.name)}
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.resultThumb}
                    />
                  ) : (
                    <View style={styles.resultIconWrap}>
                      <Ionicons
                        name="fast-food-outline"
                        size={20}
                        color="#FF7A00"
                      />
                    </View>
                  )}
                  <View style={styles.resultContent}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    {item.description ? (
                      <Text
                        style={styles.resultDescription}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={styles.resultTagRow}>
                      <Text style={styles.resultTagText}>
                        {item.categoryName ?? "Category"}
                      </Text>
                      <Text style={styles.resultTagText}>
                        {item.restaurantName ?? "Restaurant"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultPriceWrap}>
                    <Text style={styles.resultPrice}>{item.meta}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#999"
                      style={{ marginTop: 6 }}
                    />
                  </View>
                </TouchableOpacity>
              ))}
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
              {loadingCategories && (
                <Text style={styles.categoryMetaText}>Loading...</Text>
              )}
              {categoryError && (
                <Text style={styles.categoryError}>{categoryError}</Text>
              )}
              <FlatList
              data={popularCategories}
              numColumns={4}
              keyExtractor={(item) =>
                String(item.id ?? item._id ?? resolveCategoryName(item))
              }
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => {
                    const categoryName = resolveCategoryName(item);
                    setQuery(categoryName);
                    setSelected(categoryName);
                    goToResults(categoryName);
                  }}
                >
                  <Image
                    source={{ uri: resolveCategoryImage(item) }}
                    style={styles.categoryImage}
                  />
                  <Text style={styles.categoryText}>
                    {resolveCategoryName(item)}
                  </Text>
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
  categoryMetaText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },
  categoryError: {
    fontSize: 12,
    color: "#d32f2f",
    marginBottom: 6,
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
  resultThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: "#fff",
  },
  resultContent: {
    flex: 1,
  },
  resultDescription: {
    fontSize: 12,
    color: "#555",
    marginTop: 4,
  },
  resultTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  resultTagText: {
    fontSize: 11,
    color: "#777",
    backgroundColor: "#f4f4f4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
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
  resultPriceWrap: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 10,
  },
  resultPrice: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111",
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
