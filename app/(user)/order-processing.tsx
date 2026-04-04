import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import apiClient from "../../api/client";
import { ENDPOINTS } from "../../constants/Config";
import { LATEST_ORDER_ID_KEY, USER_ID_KEY } from "../../constants/train";
import { useCart } from "../../context/CartContext";

const PRIMARY = "#FF7A00";
const PEACH = "#FEEDE6";
const BG = "#f5f5f5";
const GREEN = "#4CAF50";

const formatLKR = (amount: number): string =>
  `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value?: string | null) => {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function OrderProcessingScreen() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [apiOrder, setApiOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const { restoreCart } = useCart();
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Accepted", "Ready", "Picked-up", "Arrived Station", "Delivered"];
  const displayedOrder = apiOrder ?? orderDetails;

  useEffect(() => {
    let isActive = true;
    const loadOrder = async () => {
      try {
        const [activeOrderStr, storedOrderId, storedUserId] = await Promise.all([
          AsyncStorage.getItem("activeOrder"),
          AsyncStorage.getItem(LATEST_ORDER_ID_KEY),
          AsyncStorage.getItem(USER_ID_KEY),
        ]);

        if (activeOrderStr && activeOrderStr !== "null") {
          try {
            const parsed = JSON.parse(activeOrderStr);
            if (isActive) {
              setOrderDetails(parsed);
              if (parsed?.orderId) {
                setOrderId(String(parsed.orderId));
              }
            }
          } catch (parseError) {
            console.log("Parse Error", parseError);
            if (isActive) setErrorMsg("Could not parse order details.");
          }
        } else if (isActive) {
          setErrorMsg("No active order found.");
        }

        if (isActive && storedOrderId) {
          setOrderId(storedOrderId);
        }

        if (storedOrderId && storedUserId) {
          try {
            const response = await apiClient.get(
              `${ENDPOINTS.ORDER_FETCH}/${storedUserId}/${storedOrderId}`,
            );
            const fetched = response.data?.data ?? response.data ?? null;
            if (isActive && fetched) {
              setApiOrder(fetched);
              if (fetched?.id) setOrderId(String(fetched.id));
              setErrorMsg("");
            }
          } catch (fetchError) {
            console.warn("Order fetch failed", fetchError);
            if (isActive && !orderDetails) {
              setErrorMsg("Unable to load order details.");
            }
          }
        }
      } catch (storageError) {
        console.log("Storage Error", storageError);
        if (isActive) setErrorMsg("Failed to access storage.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadOrder();

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 8000);

    return () => {
      clearInterval(timer);
      isActive = false;
    };
  }, [orderDetails]);

  const handleCancel = () => {
    if (currentStep >= 1) {
      Alert.alert("Cannot Cancel", "Your order is already being prepared and cannot be canceled.");
      return;
    }

    Alert.alert("Cancel Order", "Are you sure you want to cancel the order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          if (orderDetails && orderDetails.originalCart) {
            await restoreCart(orderDetails.originalCart);
          }
          await AsyncStorage.removeItem("activeOrder");
          router.replace("/(user)/cart");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text>Loading Order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !displayedOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={{ fontSize: 16, color: "red", padding: 20, textAlign: "center" }}>
            {errorMsg || "Order details are missing."}
          </Text>
          <TouchableOpacity
            style={[styles.bottomCancelBtn, { marginTop: 20, width: "80%" }]}
            onPress={() => router.replace("/(user)")}
          >
            <Text style={styles.bottomCancelText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const timelineEvents = [
    { label: "Ordered", timestamp: displayedOrder.orderedAt },
    { label: "Accepted", timestamp: displayedOrder.acceptedAt },
    { label: "Ready", timestamp: displayedOrder.readyAt ?? displayedOrder.pickedupAt },
    { label: "Out for delivery", timestamp: displayedOrder.outForDeliveryAt },
    { label: "Delivered", timestamp: displayedOrder.deliveredAt },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            router.replace("/(user)");
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerOrderId}>{orderId || "Order"}</Text>
        {currentStep < 1 && (
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.headerCancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.timelineContainer}>
          {steps.map((step, index) => {
            const isCompleted = currentStep >= index;
            const isLast = index === steps.length - 1;
            return (
              <View key={step} style={styles.stepWrapper}>
                <View style={styles.stepIndicator}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted ? styles.stepCircleCompleted : styles.stepCirclePending,
                    ]}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        currentStep > index ? styles.stepLineCompleted : styles.stepLinePending,
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.stepText, isCompleted ? styles.stepTextActive : styles.stepTextPending]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.imgPlaceholder}>
          <Ionicons name="fast-food-outline" size={80} color={PEACH} style={{ opacity: 0.8 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.deliveryRow}>
            <View style={styles.locationIconWrapper}>
              <Ionicons name="location-sharp" size={24} color={PRIMARY} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.deliveringToLabel}>Delivering to:</Text>
              <Text style={styles.deliveringToText}>
                {displayedOrder.station?.name ??
                  displayedOrder.station ??
                  displayedOrder.stationName ??
                  "Station"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.storeRow}>
            <Text style={styles.storeName}>
              {displayedOrder.restaurant?.name ?? displayedOrder.storeName ?? "Restaurant"}
            </Text>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call-outline" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          {displayedOrder.items &&
            displayedOrder.items.map((item: any, idx: number) => {
              const itemName = item.item?.name ?? item.name ?? "Menu Item";
              const quantity = item.quantity ?? 1;
              return (
                <View key={`${itemName}-${idx}`} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {itemName}
                  </Text>
                  <View style={styles.itemQtyBadge}>
                    <Text style={styles.itemQtyText}>{quantity}</Text>
                  </View>
                </View>
              );
            })}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seat Number</Text>
            <Text style={styles.detailValue}>{displayedOrder.seatNumber ?? "Not set"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Train</Text>
            <Text style={styles.detailValue}>
              {displayedOrder.train?.name ?? displayedOrder.trainId ?? "Train"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Sub Total</Text>
            <Text style={styles.priceValue}>
              {formatLKR(displayedOrder.subtotal ?? displayedOrder.amount ?? 0)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>
              + {formatLKR(displayedOrder.deliveryFee ?? 0)}
            </Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatLKR(displayedOrder.total ?? 0)}</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          {timelineEvents.map((event) => (
            <View key={event.label} style={styles.statusRow}>
              <Text style={styles.statusLabel}>{event.label}</Text>
              <Text style={styles.statusValue}>{formatDate(event.timestamp)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.paymentCard}>
          <Ionicons name="cash-outline" size={24} color={GREEN} />
          <Text style={styles.paymentText}>Cash on Delivery</Text>
        </View>
      </ScrollView>

      {currentStep < 1 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.bottomCancelBtn} onPress={handleCancel}>
            <Text style={styles.bottomCancelText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  backBtn: { padding: 4 },
  headerOrderId: { fontSize: 18, fontWeight: "800", color: "#111" },
  headerCancelText: { fontSize: 16, fontWeight: "600", color: "#111" },
  scrollContent: { paddingBottom: 40 },
  timelineContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  stepWrapper: {
    flex: 1,
    alignItems: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: GREEN,
  },
  stepCirclePending: {
    backgroundColor: "#ccc",
  },
  stepLine: {
    flex: 1,
    height: 2,
    position: "absolute",
    right: "-50%",
    left: "50%",
    top: 11,
    zIndex: 1,
  },
  stepLineCompleted: {
    backgroundColor: GREEN,
  },
  stepLinePending: {
    backgroundColor: "#eee",
  },
  stepText: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  stepTextActive: {
    color: "#111",
  },
  stepTextPending: {
    color: "#999",
  },
  imgPlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 20,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PEACH,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveringToLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  deliveringToText: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    flex: 1,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    paddingRight: 12,
    fontWeight: "500",
  },
  itemQtyBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemQtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: "#555",
  },
  priceValue: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 6,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#666",
    fontSize: 14,
  },
  detailValue: {
    color: "#111",
    fontWeight: "700",
  },
  statusCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 15,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusLabel: {
    color: "#444",
    fontWeight: "600",
  },
  statusValue: {
    color: "#888",
    fontSize: 13,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#f5f5f5",
  },
  paymentText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginLeft: 12,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  bottomCancelBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "rgba(226, 19, 19, 0.4)",
    alignItems: "center",
  },
  bottomCancelText: {
    color: "#e21313",
    fontSize: 16,
    fontWeight: "800",
  },
});
