import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type RootStackParamList = {
  CategoryPage: { name: string };
};

const userName = "Nilushiya"; // Replace with dynamic user data

// Dynamic Greeting Function
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning!";
  if (hour >= 12 && hour < 17) return "Good Afternoon!";
  if (hour >= 17 && hour < 21) return "Good Evening!";
  return "Good Night!";
};

// Dummy Category Data
const categories = [
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

const Dashboard = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Navigate to category page
  const handleCategoryPress = (categoryName: string) => {
    navigation.navigate("CategoryPage", { name: categoryName });
  };

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

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Categories</Text>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(item.name)}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryImage}
                />
                <Text style={styles.categoryText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

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

  // Fixed header
  header: {
    padding: 10,
    paddingLeft: 20,
    // paddingBottom: 20,
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
