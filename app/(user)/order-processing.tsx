import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
const DELIVERY_FEE_FIXED = 250;

const formatLKR = (amount: number): string =>
  `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getItemPrice = (item: any): number =>
  Number(item?.price ?? item?.item?.price ?? 0) || 0;

const getItemQuantity = (item: any): number =>
  Number(item?.quantity ?? 1) || 1;

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const orderDetailsRef = useRef(orderDetails);
  const steps = [
    "Processing",
    "Vendor Response",
    "Accepted",
    "Ready",
    "Picked-up",
    "Arrived Station",
    "Delivered",
  ];
  const displayedOrder = apiOrder ?? orderDetails;
  const isMountedRef = useRef(true);
  const orderItems = Array.isArray(displayedOrder?.items) ? displayedOrder.items : [];
  const computedSubtotal = orderItems.reduce(
    (sum, item) => sum + getItemPrice(item) * getItemQuantity(item),
    0,
  );
  const useComputedTotals = orderItems.length > 0;
  const fallbackSubtotal = Number(displayedOrder?.subtotal ?? displayedOrder?.amount ?? 0) || 0;
  const fallbackDeliveryFee = Number(displayedOrder?.deliveryFee ?? DELIVERY_FEE_FIXED) || DELIVERY_FEE_FIXED;
  const fallbackTotal = Number(displayedOrder?.total ?? 0);
  const subtotalValue = useComputedTotals ? computedSubtotal : fallbackSubtotal;
  const deliveryFeeValue = useComputedTotals ? DELIVERY_FEE_FIXED : fallbackDeliveryFee;
  const totalValue =
    useComputedTotals || fallbackTotal <= 0
      ? subtotalValue + deliveryFeeValue
      : fallbackTotal;

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
              const storedOrderIdValue = parsed?.orderId ?? parsed?.id;
              if (storedOrderIdValue) {
                setOrderId(String(storedOrderIdValue));
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

        if (isActive && storedUserId) {
          const parsedUserId = Number(storedUserId);
          if (!Number.isNaN(parsedUserId)) {
            setUserId(parsedUserId);
          }
        }

        if (storedOrderId && storedUserId) {
          try {
            const response = await apiClient.get(
            `${ENDPOINTS.ORDER_GET}/${storedUserId}/${storedOrderId}`,
            );
            const fetched = response.data?.data ?? response.data ?? null;
            console.log("Fetched Order", fetched);
            if (isActive && fetched) {
              setApiOrder(fetched);
              if (fetched?.id) setOrderId(String(fetched.id));
              setErrorMsg("");
            }
          } catch (fetchError) {
            console.warn("Order fetch failed", fetchError);
            if (isActive && !orderDetailsRef.current) {
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
  }, []);

  useEffect(() => {
    orderDetailsRef.current = orderDetails;
  }, [orderDetails]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const attemptCancel = async () => {
    if (!orderId) {
      Alert.alert("Cancel Failed", "Order reference is missing. Please try again.");
      return;
    }

    setIsCancelling(true);
    try {
      const candidateUserId =
        displayedOrder?.userId ?? orderDetails?.userId ?? userId ?? 0;
      const parsedUserId = Number(candidateUserId);
      const payloadUserId = Number.isNaN(parsedUserId) ? 0 : parsedUserId;

      await apiClient.put(`${ENDPOINTS.ORDER_CANCEL}/${orderId}`, {
        userid: payloadUserId,
      });

      if (orderDetails?.originalCart) {
        await restoreCart(orderDetails.originalCart);
      }
      await AsyncStorage.removeItem("activeOrder");
      router.replace("/(user)/cart");
    } catch (cancelError) {
      console.warn("Order cancellation failed", cancelError);
      if (isMountedRef.current) {
        Alert.alert(
          "Cancel Failed",
          "We could not cancel your order right now. Please try again in a moment.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  };

  const handleCancel = () => {
    if (currentStep >= 1) {
      Alert.alert("Cannot Cancel", "Your order is already being prepared and cannot be canceled.");
      return;
    }

    if (isCancelling) {
      return;
    }

    Alert.alert("Cancel Order", "Are you sure you want to cancel the order?", [
      { text: "No", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: attemptCancel },
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

  const currentStatusIndex = Math.min(currentStep, steps.length - 1);
  const currentStatusLabel = displayedOrder?.status ?? steps[currentStatusIndex];

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
          <TouchableOpacity onPress={handleCancel} disabled={isCancelling}>
            <Text
              style={[
                styles.headerCancelText,
                isCancelling && styles.headerCancelTextDisabled,
              ]}
            >
              {isCancelling ? "Canceling..." : "Cancel"}
            </Text>
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

          {orderItems.map((item: any, idx: number) => {
            const itemName = item.item?.name ?? item.name ?? "Menu Item";
            const quantity = getItemQuantity(item);
            const itemPrice = getItemPrice(item);
            return (
              <View key={`${itemName}-${idx}`} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {itemName}
                  </Text>
                  <Text style={styles.itemPriceText}>{formatLKR(itemPrice)}</Text>
                </View>
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
            <Text style={styles.priceValue}>{formatLKR(subtotalValue)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={styles.priceValue}>
              + {formatLKR(deliveryFeeValue)}
            </Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatLKR(totalValue)}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Order Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>{displayedOrder?.id ?? orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{currentStatusLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ordered at</Text>
            <Text style={styles.infoValue}>{formatDate(displayedOrder?.orderedAt)}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowTotal]}>
            <Text style={styles.infoLabel}>Total Paid</Text>
            <Text style={styles.infoValue}>{formatLKR(displayedOrder.total ?? displayedOrder.amount ?? 0)}</Text>
          </View>
        </View>

        {currentStep < 1 && (
          <View style={styles.infoActionRow}>
            <TouchableOpacity
              style={[
                styles.cancelOrderBtn,
                isCancelling && styles.cancelOrderBtnDisabled,
              ]}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              <Text style={styles.cancelOrderBtnText}>
                {isCancelling ? "Canceling..." : "Cancel Order"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statusSummaryCard}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <Text style={styles.statusSummaryCurrent}>{currentStatusLabel}</Text>
          <View style={styles.statusPillRow}>
            {steps.map((step, index) => {
              const isActiveStep = index <= currentStatusIndex;
              return (
                <View
                  key={step}
                  style={[
                    styles.statusPill,
                    isActiveStep ? styles.statusPillActive : styles.statusPillInactive,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.statusPillText,
                      isActiveStep ? styles.statusPillTextActive : styles.statusPillTextInactive,
                    ]}
                  >
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.paymentCard}>
          <Ionicons name="cash-outline" size={24} color={GREEN} />
          <Text style={styles.paymentText}>Cash on Delivery</Text>
        </View>
      </ScrollView>

      {currentStep < 1 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.bottomCancelBtn,
              isCancelling && styles.bottomCancelBtnDisabled,
            ]}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            <Text style={styles.bottomCancelText}>
              {isCancelling ? "Canceling..." : "Cancel Order"}
            </Text>
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
  infoCard: {
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoRowTotal: {
    marginBottom: 0,
  },
  infoLabel: {
    color: "#666",
    fontSize: 13,
  },
  infoValue: {
    color: "#111",
    fontWeight: "700",
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
  itemPriceText: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  infoActionRow: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cancelOrderBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e21313",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelOrderBtnDisabled: {
    opacity: 0.6,
  },
  cancelOrderBtnText: {
    color: "#e21313",
    fontWeight: "800",
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
  statusSummaryCard: {
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
  statusSummaryCurrent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  statusPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statusPill: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
  },
  statusPillActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  statusPillInactive: {
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
  },
  statusPillTextActive: {
    color: "#fff",
  },
  statusPillTextInactive: {
    color: "#444",
  },
  headerCancelTextDisabled: {
    opacity: 0.6,
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
  bottomCancelBtnDisabled: {
    opacity: 0.6,
  },
  bottomCancelText: {
    color: "#e21313",
    fontSize: 16,
    fontWeight: "800",
  },
});

