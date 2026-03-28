import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";

export default function TrainDetailsScreen() {
  const router = useRouter();
  const [trainNumber, setTrainNumber] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    trainNumber?: string;
    departure?: string;
    arrival?: string;
    ticketImage?: string;
  }>({});

  // 🇱🇰 Sri Lankan Train Number Validation
  // Usually 3-5 digit numbers like 1001, 8056 etc.
  const isValidTrainNumber = (number: string) => {
    const regex = /^[0-9]{3,5}$/;
    return regex.test(number);
  };

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTrainNumberChange = (text: string) => {
    setTrainNumber(text);
    if (isValidTrainNumber(text)) {
      clearError("trainNumber");
    } else if (text.length > 0) {
      setErrors(prev => ({ ...prev, trainNumber: "Train number should be 3-5 digits" }));
    } else {
      clearError("trainNumber");
    }
  };

  const handleDepartureChange = (text: string) => {
    setDeparture(text);
    if (text.trim().length > 0) {
      clearError("departure");
    }
  };

  const handleArrivalChange = (text: string) => {
    setArrival(text);
    if (text.trim().length > 0) {
      clearError("arrival");
    }
  };

  const validateForm = () => {
    let newErrors: {
      trainNumber?: string;
      departure?: string;
      arrival?: string;
      ticketImage?: string;
    } = {};
    let isValid = true;

    if (!trainNumber) {
      newErrors.trainNumber = "Please enter the train number";
      isValid = false;
    } else if (!isValidTrainNumber(trainNumber)) {
      newErrors.trainNumber = "Invalid format (3-5 digits required)";
      isValid = false;
    }

    if (!departure) {
      newErrors.departure = "Please enter the departure station";
      isValid = false;
    }

    if (!arrival) {
      newErrors.arrival = "Please enter the arrival station";
      isValid = false;
    } else if (departure.trim().toLowerCase() === arrival.trim().toLowerCase() && departure) {
      newErrors.arrival = "Arrival cannot be the same as departure";
      isValid = false;
    }

    if (!ticketImage) {
      newErrors.ticketImage = "Please upload a photo of your ticket";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Open Camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera permission is required to take a photo of your ticket.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setTicketImage(result.assets[0].uri);
      clearError("ticketImage");
    }
  };

  // Open Gallery
  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery permission is required to select your ticket photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setTicketImage(result.assets[0].uri);
      clearError("ticketImage");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      await AsyncStorage.setItem("deliveryStation", arrival);
      Alert.alert("Success", "Train details submitted successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(user)"),
        },
      ]);
    } catch (error) {
      console.log("Error saving station", error);
    }
  };

  return (
    <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          Enter your train details to place your order
        </Text>

        {/* Train Number */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.trainNumber && styles.errorInput]}
            placeholder="Train Number (e.g. 1001)"
            placeholderTextColor="#999"
            value={trainNumber}
            onChangeText={handleTrainNumberChange}
            keyboardType="numeric"
          />
          {errors.trainNumber && (
            <Text style={styles.errorText}>{errors.trainNumber}</Text>
          )}
        </View>

        {/* Departure */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.departure && styles.errorInput]}
            placeholder="Departure Station"
            placeholderTextColor="#999"
            value={departure}
            onChangeText={handleDepartureChange}
          />
          {errors.departure && (
            <Text style={styles.errorText}>{errors.departure}</Text>
          )}
        </View>

        {/* Arrival */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.arrival && styles.errorInput]}
            placeholder="Arrival Station"
            placeholderTextColor="#999"
            value={arrival}
            onChangeText={handleArrivalChange}
          />
          {errors.arrival && (
            <Text style={styles.errorText}>{errors.arrival}</Text>
          )}
        </View>

        {/* Ticket Photo */}
        <View style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>Ticket Photo</Text>

          <View style={[styles.uploadBox, errors.ticketImage && styles.errorBox]}>
            {!ticketImage ? (
              <>
                <Text style={styles.uploadText}>Upload your train ticket</Text>
                <View style={styles.iconButtonRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.iconBtn}
                    onPress={openCamera}
                  >
                    <Ionicons name="camera" size={28} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.iconBtnOutline}
                    onPress={openGallery}
                  >
                    <Ionicons name="images" size={28} color="#FF5A00" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.previewContainer}>
                <Image source={{ uri: ticketImage }} style={styles.smallPreviewImage} />
                <TouchableOpacity
                  activeOpacity={0.6}
                  style={styles.changeBtn}
                  onPress={() => setTicketImage(null)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={styles.changeText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {errors.ticketImage && (
            <Text style={styles.errorTextCenter}>{errors.ticketImage}</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.submitBtn}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Eat Now!</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
    justifyContent: "center", // Better vertical alignment
  },
  logo: {
    width: 200, // Slightly more prominent
    height: 200,
    alignSelf: "center",
    marginBottom: 0,
  },
  title: {
    fontSize: 20, // Increased for better hierarchy
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 35,
    color: "#1A1A1A",
    lineHeight: 28,
  },
  inputContainer: {
    marginBottom: 16,
    width: "100%",
  },
  input: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 16,
    height: 40,
    borderWidth: 1.5, // Thicker border for better visibility
    borderColor: "#F0F0F0",
    color: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  errorInput: {
    borderColor: Colors.default.primary,
    backgroundColor: "#FFF9F9",
  },
  errorText: {
    color: "#e21313",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    marginLeft: 4,
  },
  errorTextCenter: {
    color: "#e21313"    ,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 10,
    textAlign: "center",
  },
  uploadCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    marginVertical: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 15,
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  uploadBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.default.primary,
    borderRadius: 18,
    backgroundColor: "#FFFBF9",
  },
  errorBox: {
    borderColor: Colors.default.primary,
    backgroundColor: "#FFF5F5",
  },
  uploadText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 18,
    fontWeight: "500",
  },
  iconButtonRow: {
    flexDirection: "row",
    gap: 24,
  },
  iconBtn: {
    backgroundColor: Colors.default.primary,
    width: 50,
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: Colors.default.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  iconBtnOutline: {
    backgroundColor: "#FFF",
    width: 50,
    height: 50,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: Colors.default.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  previewContainer: {
    alignItems: "center",
    width: "100%",
  },
  smallPreviewImage: {
    width: 130,
    height: 130,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  changeText: {
    color: Colors.default.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: Colors.default.primary, // Using hardcoded to ensure consistency
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: Colors.default.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
