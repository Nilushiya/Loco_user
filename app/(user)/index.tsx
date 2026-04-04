import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "../../api/client";
import { useAppSelector } from "../../redux/hooks";

const userName = "There...!"; // Replace with dynamic user data

// Dynamic Greeting Function
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning!";
  if (hour >= 12 && hour < 17) return "Good Afternoon!";
  if (hour >= 17 && hour < 21) return "Good Evening!";
  return "Good Night!";
};

// Static fallback category data
const staticCategories = [
  {
    id: "1",
    name: "Burger",
    image:
      "https://images.unsplash.com/photo-1599785209707-46a9829f4fc4?fit=crop&w=80&h=80",
  },
  {
    id: "2",
    name: "Pizza",
    image:
      "https://images.unsplash.com/photo-1601924575720-031b7d08c091?fit=crop&w=80&h=80",
  },
  {
    id: "3",
    name: "Drinks",
    image:
      "https://images.unsplash.com/photo-1571091718767-37c1f047cbf0?fit=crop&w=80&h=80",
  },
  {
    id: "4",
    name: "Rice",
    image:
      "https://images.unsplash.com/photo-1628774150787-3808c144bb8e?fit=crop&w=80&h=80",
  },
  {
    id: "5",
    name: "Dessert",
    image:
      "https://images.unsplash.com/photo-1606755962775-3f05d59e1f28?fit=crop&w=80&h=80",
  },
  {
    id: "6",
    name: "Noodles",
    image:
      "https://images.unsplash.com/photo-1589307005795-5c2fa2f551b0?fit=crop&w=80&h=80",
  },
];

// Dummy Offer Data
const offers = [
  {
    id: "1",
    title: "50% Off on Burgers",
    description: "Enjoy delicious burgers at half price today only!",
    image: "https://via.placeholder.com/150",
  },
  {
    id: "2",
    title: "Buy 1 Get 1 Pizza",
    description: "Order any large pizza and get one free!",
    image: "https://via.placeholder.com/150",
  },
  {
    id: "3",
    title: "Free Delivery",
    description: "Free delivery on orders above Rs.1500.",
    image: "https://via.placeholder.com/150",
  },
];

const resolveCategoryName = (category: any) =>
  category?.name ?? category?.category ?? category?.title ?? "Category";

const resolveCategoryImage = (category: any) =>
  category?.image ??
  category?.photo ??
  category?.thumbnail ??
  "https://images.unsplash.com/photo-1528715471579-d1b1f5ca77b0?auto=format&fit=crop&w=80&q=60";

const normalizeCategoryPayload = (payload: any) => {
  if (!payload) {
    return [];
  }

  const potentialArrays = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.categories,
    payload?.categoryItems,
    payload?.items,
    payload?.result,
    payload?.payload,
  ];

  for (const candidate of potentialArrays) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const resolveFoodItems = (category: any) => {
  if (!category) {
    return [];
  }

  if (Array.isArray(category.items)) {
    return category.items;
  }

  if (Array.isArray(category.products)) {
    return category.products;
  }

  if (Array.isArray(category.menu)) {
    return category.menu;
  }

  return [];
};

const Dashboard = () => {
  const router = useRouter();
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [fetchedCategories, setFetchedCategories] = useState<any[]>([]);
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const token = useAppSelector((state) => state.auth.token);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("activeOrder").then((val) => {
        setHasActiveOrder(!!val);
      });
    }, [])
  );

  // Navigate to category page
  const handleCategoryPress = (categoryName: string) => {
    router.push({
      pathname: "/(user)/search-results",
      params: { q: categoryName, from: "index" },
    });
  };

  useEffect(() => {
    if (!token) {
      setFetchedCategories([]);
      setFoodItems([]);
      return;
    }

    let isMounted = true;

    const loadCategories = async () => {
      setLoadingCategories(true);
      setCategoryError(null);

      try {
        const response = await apiClient.get("/api/categoryItems");
        if (!isMounted) return;
        const normalized = normalizeCategoryPayload(response.data);
        setFetchedCategories(normalized);

        const foodCategory = normalized.find(
          (category) =>
            resolveCategoryName(category).toLowerCase() === "food"
        );

        setFoodItems(resolveFoodItems(foodCategory));
      } catch (error) {
        if (!isMounted) return;
        console.warn("Unable to load categories", error);
        setCategoryError("Unable to load categories at the moment.");
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

  const handleSearchPress = () => {
    router.push("/(user)/search");
  };

  const displayCategories = fetchedCategories.length
    ? fetchedCategories
    : staticCategories;

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.hiText}>Hi, {userName}, </Text>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}>Active</Text>
        </TouchableOpacity>
      </View>

      {hasActiveOrder && (
        <TouchableOpacity 
          style={styles.activeOrderBanner}
          onPress={() => router.push("/(user)/order-processing")}
        >
          <Ionicons name="bicycle" size={24} color="#fff" />
          <Text style={styles.activeOrderText}>View Order Status</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" style={{marginLeft: 'auto'}} />
        </TouchableOpacity>
      )}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.searchBar}
          onPress={handleSearchPress}
        >
          <Ionicons name="search-outline" size={18} color="#777" />
          <Text style={styles.searchPlaceholder}>Search for food or restaurants</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trackingCard}
          onPress={() => router.push("/(user)/tracking")}
        >
          <Ionicons name="navigate-circle" size={28} color="#FF7A00" />
          <View style={styles.trackingCopy}>
            <Text style={styles.trackingLabel}>Live Delivery Tracking</Text>
            <Text style={styles.trackingDescription}>
              Continuously share your location with the dispatch team.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Categories</Text>
          {loadingCategories && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#FF7A00" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          )}
          {categoryError && (
            <Text style={styles.categoryError}>{categoryError}</Text>
          )}
          <FlatList
            data={displayCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) =>
              String(item.id ?? item._id ?? resolveCategoryName(item))
            }
            renderItem={({ item }) => {
              const categoryName = resolveCategoryName(item);
              const categoryImage = resolveCategoryImage(item);
              return (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => handleCategoryPress(categoryName)}
                >
                  <Image
                    source={{ uri: categoryImage }}
                    style={styles.categoryImage}
                  />
                  <Text style={styles.categoryText}>{categoryName}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {foodItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Items</Text>
            <FlatList
              data={foodItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) =>
                String(item.id ?? item._id ?? item.name ?? `${index}`)
              }
              renderItem={({ item }) => {
                const foodName = item.name ?? item.title ?? "Food Item";
                const foodImage = item.image ?? item.photo ?? item.thumbnail;
                return (
                  <View style={styles.foodCard}>
                    {foodImage ? (
                      <Image
                        source={{ uri: foodImage }}
                        style={styles.foodImage}
                      />
                    ) : (
                      <View style={styles.foodPlaceholder}>
                        <Text style={styles.foodPlaceholderText}>
                          {foodName.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.foodName}>{foodName}</Text>
                    {item.price && (
                      <Text style={styles.foodPrice}>
                        {typeof item.price === "number"
                          ? `₹${item.price}`
                          : item.price}
                      </Text>
                    )}
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* Offers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          {offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <Image source={{ uri: offer.image }} style={styles.offerImage} />

              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDescription}>{offer.description}</Text>
              </View>

              <TouchableOpacity style={styles.offerButton}>
                <Text style={styles.offerButtonText}>Check Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEEDE6",
  },
  activeOrderBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF7A00",
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 15,
    marginTop: 10,
  },
  activeOrderText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    elevation: 3,
  },

  hiText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  greeting: {
    fontSize: 13,
    marginTop: 5,
    color: "#555",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 15,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: "#888",
    fontSize: 13,
  },
  trackingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7f2",
    marginHorizontal: 15,
    marginVertical: 12,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ffe0c7",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  trackingCopy: {
    flex: 1,
    marginLeft: 12,
  },
  trackingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  trackingDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  button: {
    position: "absolute",
    right: 20,
    top: 24,
    backgroundColor: "#C7F6C7",
    borderRadius: 50,
    alignItems: "center",
    width: 70,
    height: 35,
    textAlign: "center",
    padding: 5,
  },
  text: {
    color: "#0b0b0b", // white text
    fontWeight: "600",
    fontSize: 16,
  },
  scrollContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
    flex: 1,
    marginTop: 10,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  loadingText: {
    marginLeft: 8,
    color: "#555",
    fontSize: 12,
  },

  categoryError: {
    color: "#d32f2f",
    fontSize: 12,
    marginBottom: 8,
  },

  categoryCard: {
    backgroundColor: "#E0E0E0",
    padding: 10,
    borderRadius: 15,
    alignItems: "center",
    marginRight: 12,
    width: 90,
  },

  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginBottom: 5,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },

  foodCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 15,
    padding: 10,
    marginRight: 12,
    alignItems: "center",
    width: 140,
  },

  foodImage: {
    width: 120,
    height: 100,
    borderRadius: 10,
    marginBottom: 8,
  },

  foodPlaceholder: {
    width: 120,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  foodPlaceholderText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },

  foodName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  foodPrice: {
    marginTop: 4,
    color: "#FF7A00",
    fontWeight: "600",
  },

  offerCard: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#faf9f9",
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    elevation: 3,
    position: "relative",
  },

  offerImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },

  offerContent: {
    // marginTop: 10,
    paddingRight: 90, // leave space for button
  },

  offerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    paddingLeft: 15,
  },

  offerDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
    paddingLeft: 15,
  },

  offerButton: {
    position: "absolute",
    right: 10,
    // bottom: 10,
    backgroundColor: "#FF7A00",
    paddingVertical: 6,
    // paddingHorizontal: 12,
    borderRadius: 10,
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  offerButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
