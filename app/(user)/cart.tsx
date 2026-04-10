import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import apiClient from "../../api/client";
import { ENDPOINTS } from "../../constants/Config";
import { LATEST_ORDER_ID_KEY, TRAIN_DETAILS_KEY } from "../../constants/train";
import { useCart } from "../../context/CartContext";
import { useAppSelector } from "../../redux/hooks";

const DELIVERY_FEE = 50;
const PRIMARY = "#FF7A00";
const PEACH = "#FEEDE6";
const BG = "#f5f5f5";

const formatLKR = (amount: number): string =>
  `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type TrainDetails = {
  trainNumber?: string;
  seatNumber?: string;
  departure?: string;
  arrival?: string;
};

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    from?: string;
    q?: string;
    origin?: string;
    id?: string;
    name?: string;
    area?: string;
    paymentMethod?: string;
  }>();
  const { cart, isLoading, addItem, removeItem, clearAll } = useCart();
  const { userId } = useAppSelector((state) => state.auth);
  const [trainDetails, setTrainDetails] = useState<TrainDetails | null>(null);
  const [seatNumberInput, setSeatNumberInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const paymentMethod = params.paymentMethod || "COD";
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryStation, setDeliveryStation] = useState("Your Station");

  useEffect(() => {
    AsyncStorage.getItem("deliveryStation")
      .then((val) => {
        if (val) setDeliveryStation(val);
      })
      .catch((e) => console.log("Failed to load delivery station", e));
  }, []);

  useEffect(() => {
    const loadTrainDetails = async () => {
      const raw = await AsyncStorage.getItem(TRAIN_DETAILS_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setTrainDetails(parsed);
          if (parsed?.seatNumber) {
            setSeatNumberInput(parsed.seatNumber);
          }
        } catch (e) {
          console.warn("Unable to parse train details", e);
        }
      }
    };

    loadTrainDetails();
  }, []);

  const goBack = () => {
    const from = params.from;
    console.log("from : ", from);
    if (from === "search-results") {
      router.replace({
        pathname: "/(user)/search-results",
        params: { q: params.q || "", from: params.origin || "search" },
      });
    } else if (from === "store") {
      router.replace({
        pathname: "/(user)/store",
        params: {
          id: params.id || "",
          name: params.name || "",
          area: params.area || "",
          q: params.q || "",
          from: params.origin || "search",
        },
      });
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(user)");
      }
    }
  };

  const itemsArray = useMemo(
    () => (cart && cart.items ? Object.values(cart.items) : []),
    [cart],
  );

  const subtotal = useMemo(
    () => itemsArray.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [itemsArray],
  );

  const total = useMemo(() => subtotal + DELIVERY_FEE, [subtotal]);

  const handleClearCart = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to remove all items?")) {
        clearAll();
      }
    } else {
      Alert.alert("Clear Cart", "Are you sure you want to remove all items?", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearAll },
      ]);
    }
  };

  const handlePlaceOrder = () => {
    setOrderError(null);
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!seatNumberInput.trim()) {
      setOrderError("Please enter your seat number.");
      return;
    }

    if (!cart || itemsArray.length === 0) {
      setOrderError("Cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      const orderedItems = itemsArray.map((item) => ({
        id: Number(item.id) || item.id,
        quantity: item.quantity,
      }));

      const payload = {
        seatNumber: seatNumberInput.trim(),
        userId: userId ?? 0,
        trainId: Number(trainDetails?.trainId ?? 0),
        stationId: Number(trainDetails?.arrivalStationId ?? 0),
        restaurantId: Number(cart.storeId) ?? 0,
        orderedItems,
      };

      const response = await apiClient.post(ENDPOINTS.ORDER_CREATE, payload);
      console.log("Order creation response:", response.data);
      const createdOrder = response.data?.data ?? response.data ?? null;
      const orderId = createdOrder?.id;

      if (trainDetails) {
        const updated = { ...trainDetails, seatNumber: seatNumberInput.trim() };
        await AsyncStorage.setItem(TRAIN_DETAILS_KEY, JSON.stringify(updated));
      }

      if (orderId) {
        await AsyncStorage.setItem(LATEST_ORDER_ID_KEY, orderId.toString());
      }

      const orderData = {
        originalCart: cart,
        storeName: cart?.storeName,
        items: itemsArray,
        subtotal,
        deliveryFee: DELIVERY_FEE,
        total,
        station: deliveryStation,
        seatNumber: seatNumberInput.trim(),
        orderId,
      };
      await AsyncStorage.setItem("activeOrder", JSON.stringify(orderData));
      await clearAll();
      setShowConfirmModal(false);
      router.replace("/(user)/order-processing");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ?? "Unable to place your order.";
      setOrderError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoading && (!cart || itemsArray.length === 0)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={72} color="#ccc" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items from a store to get started
          </Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={goBack}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleClearCart}
            style={{ padding: 6, marginRight: 6 }}
          >
            <Ionicons name="trash-outline" size={22} color="#c0392b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={itemsArray}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          cart ? (
            <View style={styles.storeCard}>
              <Ionicons name="storefront-outline" size={20} color={PRIMARY} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.storeName}>
                  {cart?.storeName || "Unknown Store"}
                </Text>
                <Text style={styles?.storeArea}>
                  {cart?.storeArea || "Unknown Area"}
                </Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatLKR(item.price)}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  cart?.storeId && removeItem(cart.storeId, item.id)
                }
              >
                <Ionicons
                  name={item.quantity === 1 ? "trash-outline" : "remove"}
                  size={18}
                  color={item.quantity === 1 ? "#c0392b" : "#111"}
                />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  if (cart?.storeId) {
                    addItem(
                      cart.storeId,
                      cart?.storeName || "",
                      cart?.storeArea || "",
                      {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                      },
                    );
                  }
                }}
              >
                <Ionicons name="add" size={18} color="#111" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatLKR(subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>
                  {formatLKR(DELIVERY_FEE)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatLKR(total)}</Text>
              </View>
            </View>

            <View style={styles.paymentMethodCard}>
              <View style={styles.paymentMethodInfo}>
                <Ionicons
                  name={
                    paymentMethod === "Card" ? "card-outline" : "cash-outline"
                  }
                  size={24}
                  color={PRIMARY}
                />
                <Text style={styles.paymentMethodText}>
                  {paymentMethod === "Card"
                    ? "Online Payment (Card)"
                    : "Cash on Delivery"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(user)/payment-options",
                    params,
                  })
                }
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.placeOrderBtn}
              onPress={handlePlaceOrder}
              activeOpacity={0.85}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="train-outline" size={40} color={PRIMARY} />
            <Text style={styles.modalTitle}>Confirm Your Order</Text>
            <View style={styles.modalInfoCard}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Train Number</Text>
                <Text style={styles.modalValue}>
                  {trainDetails?.trainNumber ?? "Not Available"}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Delivery Station</Text>
                <Text style={styles.modalValue}>{deliveryStation}</Text>
              </View>
              <View style={[styles.modalInfoRow, styles.modalSeatRow]}>
                <Text style={styles.modalLabel}>Seat Number</Text>
                <TextInput
                  style={styles.modalSeatInput}
                  value={seatNumberInput}
                  onChangeText={setSeatNumberInput}
                  placeholder="Enter seat"
                  returnKeyType="done"
                />
              </View>
            </View>
            <View style={styles.modalInfoCard}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Payment</Text>
                <Text style={styles.modalValue}>
                  {paymentMethod === "Card"
                    ? "Online Payment (Card)"
                    : "Cash on Delivery"}
                </Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalLabel}>Total</Text>
                <Text style={styles.modalValue}>{formatLKR(total)}</Text>
              </View>
            </View>
            {orderError && <Text style={styles.modalError}>{orderError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.confirmBtn,
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleConfirmOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  listContent: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  storeName: { fontSize: 16, fontWeight: "700", color: "#111" },
  storeArea: { fontSize: 13, color: "#666", marginTop: 2 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  itemImage: { width: 70, height: 70, borderRadius: 10, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700", color: "#111" },
  itemPrice: { fontSize: 13, color: "#444", marginTop: 4 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5D1",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f5c49c",
  },
  stepBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  qtyText: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
    color: "#111",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: "#555" },
  summaryValue: { fontSize: 14, color: "#111", fontWeight: "600" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#111" },
  totalValue: { fontSize: 16, fontWeight: "800", color: PRIMARY },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  paymentMethodInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginLeft: 12,
  },
  changeBtnText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 14,
  },
  placeOrderBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  placeOrderText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#111", marginTop: 20 },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 8,
    textAlign: "center",
  },
  goBackBtn: {
    marginTop: 24,
    backgroundColor: PEACH,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  goBackText: { color: PRIMARY, fontWeight: "700", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginBottom: 8,
  },
  modalInfoCard: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalSeatRow: {
    alignItems: "flex-start",
  },
  modalLabel: {
    fontSize: 13,
    color: "#7e7e7e",
  },
  modalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    maxWidth: "60%",
    textAlign: "right",
  },
  modalSeatInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: "50%",
    marginTop: 4,
    backgroundColor: "#fff",
  },
  modalError: {
    color: "#c62828",
    fontSize: 13,
    marginBottom: 6,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  cancelText: {
    color: "#555",
    fontWeight: "700",
    fontSize: 15,
  },
  confirmBtn: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
