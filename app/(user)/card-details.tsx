import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#FF7A00";
const BG = "#f5f5f5";

export default function CardDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    // Load stored card details if any
    const loadCardDetails = async () => {
      try {
        const storedCard = await AsyncStorage.getItem("USER_CARD_DETAILS");
        if (storedCard) {
          const parsed = JSON.parse(storedCard);
          setName(parsed.name || "");
          setCardNumber(parsed.cardNumber || "");
          setExpiry(parsed.expiry || "");
          setCvv(parsed.cvv || "");
        }
      } catch (err) {
        console.warn("Failed to load card details from storage", err);
      }
    };
    loadCardDetails();
  }, []);

  const formatCardNumber = (text: string) => {
    const cleaned = ("" + text).replace(/\D/g, "");
    let formatted = "";
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += cleaned[i];
    }
    setCardNumber(formatted.substring(0, 19)); // 16 digits + 3 spaces
  };

  const formatExpiry = (text: string) => {
    const cleaned = ("" + text).replace(/\D/g, "");
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const formatCvv = (text: string) => {
    const cleaned = ("" + text).replace(/\D/g, "");
    setCvv(cleaned.substring(0, 4));
  };

  const handleSaveCard = () => {
    if (name.trim().length < 3) {
      Alert.alert("Invalid Name", "Please enter the cardholder name.");
      return;
    }
    const rawNumber = cardNumber.replace(/\D/g, "");
    if (rawNumber.length < 15) {
      Alert.alert("Invalid Card Number", "Please enter a valid card number.");
      return;
    }
    if (expiry.length < 5) {
      Alert.alert("Invalid Expiry", "Please enter a valid expiry date (MM/YY).");
      return;
    }
    const [month, year] = expiry.split("/");
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (Number(month) < 1 || Number(month) > 12) {
      Alert.alert("Invalid Expiry", "Month must be between 01 and 12.");
      return;
    }
    if (Number(year) < currentYear || (Number(year) === currentYear && Number(month) < currentMonth)) {
      Alert.alert("Card Expired", "Please enter a valid unexpired card.");
      return;
    }
    if (cvv.length < 3) {
      Alert.alert("Invalid CVV", "Please enter a valid CVV.");
      return;
    }

    const saveDetails = async () => {
      try {
        await AsyncStorage.setItem("USER_CARD_DETAILS", JSON.stringify({
          name: name.trim(),
          cardNumber,
          expiry,
          cvv,
        }));
      } catch (err) {
        console.warn("Failed to save card details", err);
      }
    };

    saveDetails().then(() => {
      // Success - navigate back to cart with payment method as Card
      router.replace({
        pathname: "/(user)/cart",
        params: { ...params, paymentMethod: "Card" },
      });
    });
  };

  const isFormComplete = name.trim().length >= 3 && cardNumber.length >= 19 && expiry.length === 5 && cvv.length >= 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/(user)/cart")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Card Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Enter your card details securely</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cardholder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Card Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={formatCardNumber}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={expiry}
                onChangeText={formatExpiry}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>CVV/CVC</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                secureTextEntry
                value={cvv}
                onChangeText={formatCvv}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, !isFormComplete && styles.saveBtnDisabled]}
            onPress={handleSaveCard}
          >
            <Text style={styles.saveBtnText}>Confirm Card</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: 24,
  },
  label: {
    fontSize: 15,
    color: "#555",
    marginBottom: 24,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnDisabled: {
    backgroundColor: "#ccc",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
