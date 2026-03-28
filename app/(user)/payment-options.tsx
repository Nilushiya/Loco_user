import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#FF7A00";
const BG = "#f5f5f5";

export default function PaymentOptionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleSelectOption = (method: string) => {
    if (method === "Card") {
      router.push({
        pathname: "/(user)/card-details",
        params
      });
    } else {
      router.replace({
        pathname: "/(user)/cart",
        params: { ...params, paymentMethod: "COD" },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Options</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select a payment method</Text>

        <TouchableOpacity style={styles.optionCard} onPress={() => handleSelectOption("COD")}>
          <View style={styles.optionLeft}>
            <Ionicons name="cash-outline" size={28} color={PRIMARY} />
            <Text style={styles.optionText}>Cash on Delivery</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => handleSelectOption("Card")}>
          <View style={styles.optionLeft}>
            <Ionicons name="card-outline" size={28} color={PRIMARY} />
            <Text style={styles.optionText}>Online Payment (Card)</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: { padding: 6, borderRadius: 20 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginLeft: 16,
  },
});
