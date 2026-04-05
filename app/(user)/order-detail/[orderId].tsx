import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector } from "../../../redux/hooks";
import apiClient from "../../../api/client";
import { ENDPOINTS } from "../../../constants/Config";
import { MOCK_ORDERS } from "../../../utils/orderMocks";

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatusLabel = (status?: string) => {
  if (!status) return "Pending";
  return status
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const OrderStatusRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [apiOrder, setApiOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userId } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const load = async () => {
      if (!userId || !params.orderId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get(
          `${ENDPOINTS.ORDER_GET}/${userId}/${params.orderId}`,
        );
        setApiOrder(response.data?.data ?? null);
      } catch (e) {
        console.warn("order detail failed", e);
        setError("Unable to load order.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, params.orderId]);

  const source = apiOrder ?? MOCK_ORDERS.find((o) => o.id === params.orderId) ?? null;

  if (loading && !source) {
    return (
      <View style={styles.emptyScreen}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  if (!source) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>{error || "Order not found."}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const people = [
    {
      label: "Restaurant",
      name: source.restaurant?.name ?? source.restaurantName ?? "N/A",
      phone: source.restaurant?.phoneNumber ?? "-",
    },
    {
      label: "User",
      name: `${source.user?.firstname ?? ""} ${source.user?.lastname ?? ""}`.trim() || "Guest",
      phone: source.user?.phoneNumber ?? "-",
    },
    {
      label: "Pickup",
      name: source.pickupPerson?.name ?? "N/A",
      phone: source.pickupPerson?.phoneNumber ?? "-",
    },
    {
      label: "Delivery",
      name: source.deliveryPerson?.name ?? "N/A",
      phone: source.deliveryPerson?.phoneNumber ?? "-",
    },
  ];

  const items = source.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    const price = item.price ?? item.item?.price ?? 0;
    const quantity = item.quantity ?? 1;
    return sum + price * quantity;
  }, 0);
  const deliveryFee = source.deliveryFee ?? 250;
  const totalAmount = source.total ?? subtotal + deliveryFee;
  const paymentMethod = source.paymentMethod ?? "Cash on Delivery";
  const orderTimestamp =
    source.orderedAt ?? source.acceptedAt ?? source.createdAt ?? source.updatedAt ?? "";
  const restaurantLabel = source.restaurant?.name ?? source.restaurantName ?? "Restaurant";
  const userLabel =
    `${source.user?.firstname ?? ""} ${source.user?.lastname ?? ""}`.trim() || "Guest";
  const trainLabel = source.train?.name ?? source.trainName ?? "";
  const stationLabel = source.station?.name ?? source.stationName ?? "Station";
  const seatLabel = source.seatNumber ? `Seat ${source.seatNumber}` : "";
  const statusLabel = formatStatusLabel(source.status);
  const statusVariant = (source.status ?? "PENDING").toUpperCase();
  const statusBackgroundColor = ["ACCEPTED", "DELIVERED"].includes(statusVariant)
    ? "#E6F9EF"
    : ["CANCELLED", "REJECTED"].includes(statusVariant)
    ? "#FFE5E5"
    : "#FFF4E5";
  const statusTextColor = ["ACCEPTED", "DELIVERED"].includes(statusVariant)
    ? "#0E6A3D"
    : ["CANCELLED", "REJECTED"].includes(statusVariant)
    ? "#9D1C1C"
    : "#A35A00";
  const orderDetails = [
    { label: "Restaurant", value: restaurantLabel },
    { label: "User", value: userLabel },
    { label: "Train", value: trainLabel || "N/A" },
    { label: "Station", value: stationLabel },
    { label: "Seat", value: seatLabel || "Not set" },
    {
      label: "Ordered at",
      value: orderTimestamp
        ? `${formatDate(orderTimestamp)} · ${formatTime(orderTimestamp)}`
        : "-",
    },
  ];

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order ID - {source.id}</Text>
        </View>
        <Text style={styles.subHeader}>
          {userLabel} · {source.user?.phoneNumber ?? "-"}
        </Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBackgroundColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusTextColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        <View style={styles.timelineRow}>
          <View style={styles.timelineIndicator}>
            <View style={[styles.timelineDot, styles.timelineDotPrimary]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, styles.timelineDotSecondary]} />
          </View>
          <View style={styles.timelineText}>
            <Text style={styles.timelineTitle}>{restaurantLabel}</Text>
            {source.restaurant?.address ? (
              <Text style={styles.timelineCaption}>{source.restaurant.address}</Text>
            ) : null}
            <Text style={[styles.timelineTitle, { marginTop: 12 }]}>{stationLabel}</Text>
            {trainLabel ? (
              <Text style={styles.timelineCaption}>{`Train ${trainLabel}`}</Text>
            ) : null}
            {seatLabel ? (
              <Text style={styles.timelineCaption}>{seatLabel}</Text>
            ) : null}
            {orderTimestamp ? (
              <Text style={styles.timelineCaption}>
                {formatDate(orderTimestamp)} · {formatTime(orderTimestamp)}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.infoGrid}>
          {orderDetails.map((row) => (
            <OrderStatusRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>
        <View style={styles.personSection}>
          <Text style={styles.sectionTitleSmall}>People</Text>
          {people.map((item) => (
            <View key={item.label} style={styles.personRow}>
              <Text style={styles.personLabel}>{item.label}</Text>
              <Text style={styles.personValue}>
                {item.name} · {item.phone}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabPill, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabPill}>
            <Text style={styles.tabText}>Help</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>Order details</Text>
        {items.map((item: any) => {
          const name = item.item?.name ?? item.name ?? "Item";
          const price = item.price ?? item.item?.price ?? 0;
          const quantity = item.quantity ?? 1;
          return (
            <View key={`${item.id ?? name}-${price}`} style={styles.detailRow}>
              <View>
                <Text style={styles.detailLabel}>
                  {name} x{quantity}
                </Text>
                <Text style={styles.detailCaption}>Unit {formatLKR(price)}</Text>
              </View>
              <Text style={styles.detailValue}>{formatLKR(price * quantity)}</Text>
            </View>
          );
        })}
        <View style={styles.divider} />
        <OrderStatusRow label="Sub Total" value={formatLKR(subtotal)} />
        <OrderStatusRow label="Delivery Fee" value={formatLKR(deliveryFee)} />
        <View style={styles.divider} />
        <OrderStatusRow label="Paid by" value={paymentMethod} />
        <OrderStatusRow label="Total" value={formatLKR(totalAmount)} />
        <View style={styles.tipRow}>
          <Text style={styles.tipTitle}>Driver tip</Text>
          <TouchableOpacity style={styles.tipButton}>
            <Text style={styles.tipButtonText}>Tip Driver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="mail-outline" size={20} color="#111" />
            <Text style={styles.actionLabel}>Mail Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="help-circle-outline" size={20} color="#111" />
            <Text style={styles.actionLabel}>Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const formatLKR = (value?: number) =>
  `LKR ${Number(value ?? 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginLeft: 12,
  },
  subHeader: {
    fontSize: 16,
    color: "#777",
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusLabel: {
    fontWeight: "600",
    color: "#555",
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  timelineRow: {
    flexDirection: "row",
    marginTop: 12,
    marginBottom: 12,
  },
  timelineIndicator: {
    width: 32,
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineDotPrimary: {
    backgroundColor: "#0061ff",
  },
  timelineDotSecondary: {
    backgroundColor: "#ff9a00",
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#e9e9e9",
    marginVertical: 6,
  },
  timelineText: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  timelineCaption: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailLabel: {
    color: "#555",
    fontSize: 14,
  },
  detailCaption: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabActive: {
    borderBottomColor: "#ffb400",
  },
  tabText: {
    fontSize: 14,
    color: "#777",
  },
  tabTextActive: {
    color: "#111",
    fontWeight: "700",
  },
  personSection: {
    marginBottom: 18,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  personRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  personLabel: {
    fontWeight: "600",
    fontSize: 13,
  },
  personValue: {
    fontSize: 13,
    color: "#333",
  },
  tipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  tipButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tipButtonText: {
    fontWeight: "700",
    color: "#111",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f3f3f3",
    flex: 1,
    justifyContent: "center",
  },
  actionLabel: {
    fontWeight: "700",
    color: "#111",
  },
  infoGrid: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eee",
  },
  emptyScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#777",
    marginBottom: 12,
  },
  backBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#111",
  },
  backBtnText: {
    color: "#111",
    fontWeight: "700",
  },
});
