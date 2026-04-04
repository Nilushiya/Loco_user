import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/theme";
import { trainService, TrainOption, StationOption } from "../../services/trainService";
import { TRAIN_DETAILS_KEY, TRAIN_DETAILS_TTL_MS } from "../../constants/train";

export default function TrainDetailsScreen() {
  const router = useRouter();
  const [seatNumber, setSeatNumber] = useState("");
  const [ticketImage, setTicketImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    train?: string;
    departure?: string;
    arrival?: string;
    seatNumber?: string;
    ticketImage?: string;
  }>({});
  const [availableTrains, setAvailableTrains] = useState<TrainOption[]>([]);
  const [availableStations, setAvailableStations] = useState<StationOption[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainOption | null>(null);
  const [selectedDepartureStation, setSelectedDepartureStation] = useState<StationOption | null>(null);
  const [selectedArrivalStation, setSelectedArrivalStation] = useState<StationOption | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"train" | "departure" | "arrival" | null>(null);
  const [isFetchingTrains, setIsFetchingTrains] = useState(false);
  const [isFetchingStations, setIsFetchingStations] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);
  const isMounted = useRef(true);

  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSeatChange = (text: string) => {
    setSeatNumber(text);
    if (text.trim().length > 0) {
      clearError("seatNumber");
    }
  };

  const openPicker = (target: "train" | "departure" | "arrival") => {
    setPickerTarget(target);
  };

  const handlePickerSelect = (option: TrainOption | StationOption) => {
    if (pickerTarget === "train") {
      setSelectedTrain(option as TrainOption);
      setErrors((prev) => ({ ...prev, train: undefined }));
    } else if (pickerTarget === "departure") {
      const selected = option as StationOption;
      setSelectedDepartureStation(selected);
      setErrors((prev) => ({ ...prev, departure: undefined }));
      if (selectedArrivalStation && selectedArrivalStation.id === selected.id) {
        setSelectedArrivalStation(null);
        setErrors((prev) => ({ ...prev, arrival: undefined }));
      }
    } else if (pickerTarget === "arrival") {
      setSelectedArrivalStation(option as StationOption);
      setErrors((prev) => ({ ...prev, arrival: undefined }));
    }
    setPickerTarget(null);
  };

  const validateForm = () => {
    let newErrors: {
      train?: string;
      departure?: string;
      arrival?: string;
      seatNumber?: string;
      ticketImage?: string;
    } = {};
    let isValid = true;

    if (!selectedTrain) {
      newErrors.train = "Please select your train";
      isValid = false;
    }

    if (!selectedDepartureStation) {
      newErrors.departure = "Please select a departure station";
      isValid = false;
    }

    if (!selectedArrivalStation) {
      newErrors.arrival = "Please select an arrival station";
      isValid = false;
    } else if (
      selectedDepartureStation &&
      selectedArrivalStation &&
      selectedDepartureStation.id === selectedArrivalStation.id
    ) {
      newErrors.arrival = "Arrival cannot be the same as departure";
      isValid = false;
    }

    if (!seatNumber) {
      newErrors.seatNumber = "Please enter your seat number";
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
      const trainName = selectedTrain?.name ?? "";
      const trainNumberValue = selectedTrain?.mname ?? trainName;
      const trainType = selectedTrain?.type ?? "";
      const departureName = selectedDepartureStation?.name ?? "";
      const arrivalName = selectedArrivalStation?.name ?? "";
      const payload = {
        trainNumber: trainNumberValue,
        trainName,
        trainMName: selectedTrain?.mname ?? "",
        trainType,
        trainId: selectedTrain?.id ?? 0,
        departure: departureName,
        departureStationId: selectedDepartureStation?.id ?? 0,
        arrival: arrivalName,
        arrivalStationId: selectedArrivalStation?.id ?? 0,
        seatNumber,
        ticketImage,
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem("trainDetails", JSON.stringify(payload));
      await AsyncStorage.setItem("deliveryStation", arrivalName);
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

  useEffect(() => {
    const verifyTrainDetails = async () => {
      try {
        const raw = await AsyncStorage.getItem(TRAIN_DETAILS_KEY);
        if (!raw) {
          if (isMounted.current) setIsCheckingSaved(false);
          return;
        }

        const parsed = JSON.parse(raw);
        const hasValidRecord =
          parsed?.savedAt && Date.now() - parsed.savedAt < TRAIN_DETAILS_TTL_MS;

        if (hasValidRecord) {
          router.replace("/(user)");
          return;
        }

        await AsyncStorage.multiRemove([TRAIN_DETAILS_KEY, "deliveryStation"]);
      } catch (error) {
        console.log("Error checking train details", error);
      }

      if (isMounted.current) {
        setIsCheckingSaved(false);
      }
    };

    verifyTrainDetails();

    return () => {
      isMounted.current = false;
    };
  }, [router]);

  useEffect(() => {
    const loadTrains = async () => {
      setIsFetchingTrains(true);
      try {
        const trains = await trainService.fetchTrains();
        setAvailableTrains(trains);
      } catch (error) {
        console.warn("Failed to load trains", error);
      } finally {
        setIsFetchingTrains(false);
      }
    };

    const loadStations = async () => {
      setIsFetchingStations(true);
      try {
        const stations = await trainService.fetchStations();
        setAvailableStations(stations);
      } catch (error) {
        console.warn("Failed to load stations", error);
      } finally {
        setIsFetchingStations(false);
      }
    };

    loadTrains();
    loadStations();
  }, []);

  if (isCheckingSaved) {
    return (
      <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={Colors.default.primary} />
          <Text style={styles.checkingText}>Checking your train details...</Text>
        </View>
      </LinearGradient>
    );
  }

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

        <View style={styles.inputContainer}>
          <Text style={[styles.selectLabel, errors.train && styles.errorLabel]}>
            Select Train
          </Text>
          <TouchableOpacity
            style={[styles.selectBox, errors.train && styles.errorBorder]}
            onPress={() => openPicker("train")}
          >
            {isFetchingTrains ? (
              <ActivityIndicator color="#444" />
            ) : (
              <Text
                style={[
                  styles.selectText,
                  selectedTrain ? undefined : styles.placeholderText,
                ]}
              >
                {selectedTrain
                  ? `${selectedTrain.mname ?? selectedTrain.name} ${
                      selectedTrain.type ? `(${selectedTrain.type})` : ""
                    }`
                  : "Choose your train"}
              </Text>
            )}
          </TouchableOpacity>
          {errors.train && <Text style={styles.errorText}>{errors.train}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.selectLabel, errors.departure && styles.errorLabel]}>
            Departure Station
          </Text>
          <TouchableOpacity
            style={[styles.selectBox, errors.departure && styles.errorBorder]}
            onPress={() => openPicker("departure")}
          >
            <Text
              style={[
                styles.selectText,
                selectedDepartureStation ? undefined : styles.placeholderText,
              ]}
            >
              {selectedDepartureStation
                ? selectedDepartureStation.name
                : "Select departure"}
            </Text>
          </TouchableOpacity>
          {errors.departure && (
            <Text style={styles.errorText}>{errors.departure}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.selectLabel, errors.arrival && styles.errorLabel]}>
            Arrival Station
          </Text>
          <TouchableOpacity
            style={[styles.selectBox, errors.arrival && styles.errorBorder]}
            onPress={() => openPicker("arrival")}
          >
            <Text
              style={[
                styles.selectText,
                selectedArrivalStation ? undefined : styles.placeholderText,
              ]}
            >
              {selectedArrivalStation
                ? selectedArrivalStation.name
                : "Select arrival"}
            </Text>
          </TouchableOpacity>
          {errors.arrival && (
            <Text style={styles.errorText}>{errors.arrival}</Text>
          )}
        </View>

        {/* Seat */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.seatNumber && styles.errorInput]}
            placeholder="Seat Number"
            placeholderTextColor="#999"
            value={seatNumber}
            onChangeText={handleSeatChange}
          />
          {errors.seatNumber && (
            <Text style={styles.errorText}>{errors.seatNumber}</Text>
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

      <Modal
        visible={Boolean(pickerTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>
              {pickerTarget === "train"
                ? "Select Train"
                : "Select Station"}
            </Text>
            <FlatList
              data={
                pickerTarget === "train"
                  ? availableTrains
                  : availableStations
              }
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handlePickerSelect(item)}
                >
                  <Text style={styles.pickerItemText}>
                    {pickerTarget === "train"
                      ? `${
                          (item as TrainOption).mname ??
                          (item as TrainOption).name
                        }${(item as TrainOption).type ? ` (${(item as TrainOption).type})` : ""}`
                      : item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.pickerDivider} />
              )}
              ListEmptyComponent={() => (
                <Text style={styles.pickerEmpty}>
                  {pickerTarget === "train"
                    ? "No trains available"
                    : "No stations available"}
                </Text>
              )}
            />
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setPickerTarget(null)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  checkingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
    textAlign: "center",
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
  selectLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a4a4a",
    marginBottom: 6,
  },
  selectBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  selectText: {
    fontSize: 16,
    color: "#111",
  },
  placeholderText: {
    color: "#999",
  },
  errorBorder: {
    borderColor: Colors.default.primary,
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
  errorLabel: {
    color: Colors.default.primary,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  pickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    padding: 18,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickerItem: {
    paddingVertical: 12,
  },
  pickerItemText: {
    fontSize: 15,
    color: "#222",
  },
  pickerDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  pickerEmpty: {
    paddingVertical: 16,
    textAlign: "center",
    color: "#888",
  },
  pickerCancel: {
    marginTop: 12,
    alignItems: "center",
  },
  pickerCancelText: {
    color: Colors.default.primary,
    fontWeight: "700",
  },
});
