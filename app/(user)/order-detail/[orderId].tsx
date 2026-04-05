import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const formatDate = (value: string) =>
  new Date(value)?.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
const formatTime = (value: string) =>
  new Date(value)?.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

  // const order = useMemo(
  //   () => MOCK_ORDERS.find((o) => o.id === params.orderId),
  //   [params.orderId],
  // );

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

  const source = apiOrder;

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

  if (loading && !source) {
    return (
      <View style={styles.emptyScreen}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order ID - {source.id}</Text>
      </View>
      <Text style={styles.subHeader}>
        {source.user?.firstname} {source.user?.lastname} {source.user?.phoneNumber}
      </Text>

      <View style={styles.timelineRow}>
              <View style={styles.timelineIndicator}>
                <View style={[styles.timelineDot, styles.timelineDotPrimary]} />
                <View style={styles.timelineLine} />
                <View style={[styles.timelineDot, styles.timelineDotSecondary]} />
              </View>
              <View style={styles.timelineText}>
                <Text style={styles.timelineTitle}>{source.pickup}</Text>
                <Text style={styles.timelineCaption}>
                  {formatDate(source.date)} {formatTime(source.date)}
                </Text>
                <Text style={[styles.timelineTitle, { marginTop: 12 }]}>{source.dropoff}</Text>
                <Text style={styles.timelineCaption}>
                  {formatDate(source.date)} {formatTime(source.date)}
                </Text>
                {source.trainName || source.stationName || source.seatNumber ? (
                  <Text style={styles.timelineCaption}>
                    {source.trainName ? `Train ${source.trainName}` : ""}
                    {source.stationName ? ` · Station ${source.stationName}` : ""}
                    {source.seatNumber ? ` · Seat ${source.seatNumber}` : ""}
                  </Text>
                ) : null}
              </View>
            </View>
      <View style={styles.timelineSection}>
        <OrderStatusRow label="Pickup" value={source.pickup} />
        <Text style={styles.timelineCaption}>
          {formatTime(source.date)} - {formatDate(source.date)}
        </Text>
        <OrderStatusRow label="Dropoff" value={source.dropoff} />
        <Text style={styles.timelineCaption}>
          {formatTime(source.date)} - {formatDate(source.date)}
        </Text>
      </View>

      <View style={styles.infoGrid}>
        <OrderStatusRow
          label="Restaurant"
          value={source.restaurant?.name ?? source.restaurantName ?? "N/A"}
        />
        <OrderStatusRow
          label="User"
          value={`${source.user?.firstname ?? ""} ${source.user?.lastname ?? ""}`.trim() || "Guest"}
        />
        <OrderStatusRow
          label="Train"
          value={source.train?.name ?? source.trainName ?? "N/A"}
        />
        <OrderStatusRow
          label="Station"
          value={source.station?.name ?? source.stationName ?? "N/A"}
        />
        <OrderStatusRow label="Seat" value={source.seatNumber ?? "Not set"} />
      </View>

      <View style={styles.infoGrid}>
        <OrderStatusRow
          label="Train"
          value={source.train?.name ?? source.trainName ?? "N/A"}
        />
        <OrderStatusRow
          label="Station"
          value={source.station?.name ?? source.stationName ?? "N/A"}
        />
        <OrderStatusRow
          label="Restaurant"
          value={source.restaurant?.name ?? source.restaurantName ?? "N/A"}
        />
        <OrderStatusRow label="Seat" value={source.seatNumber ?? "Not set"} />
      </View>

      <View style={styles.personSection}>
        <Text style={styles.sectionTitleSmall}>People</Text>
        {[{
          label: "User",
          person: {
            name: source.userName,
            phone: source.userPhone,
          },
        },
        {
          label: "Pickup",
          person: source.pickupPerson,
        },
        {
          label: "Delivery",
          person: source.deliveryPerson,
        }].map((item) => (
          <View key={item.label} style={styles.personRow}>
            <Text style={styles.personLabel}>{item.label}</Text>
            <Text style={styles.personValue}>
              {item.person?.name ?? "-"} · {item.person?.phoneNumber ?? "-"}
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

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Order details</Text>
        {(source.items ?? []).map((item: any) => {
          const name = item.item?.name ?? item.name ?? "";
          const price = item.price ?? item.item?.price ?? 0;
          const quantity = item.quantity ?? 1;
          return (
            <View key={`${name}-${price}`} style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {name} x{quantity}
              </Text>
              <Text style={styles.detailValue}>LKR {price.toFixed(2)}</Text>
            </View>
          );
        })}
        <View style={styles.divider} />
        <OrderStatusRow label="Sub Total" value={"+ " + formatLKR(source.subtotal)} />
        <OrderStatusRow label="Delivery Fee" value={"+ " + formatLKR(source.deliveryFee)} />
        <View style={styles.divider} />
        <OrderStatusRow label="Paid by" value={source.paymentMethod} />
        <OrderStatusRow label="Total" value={formatLKR(source.amount)} />

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

const formatLKR = (value: number) =>
  `LKR ${value?.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
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
  overviewCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 16,
  },
  overviewLeft: {},
  overviewType: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  driverCard: {
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  driverName: {
    fontWeight: "700",
  },
  driverVehicle: {
    fontSize: 12,
    color: "#777",
  },
  driverRating: {
    fontSize: 12,
    color: "#000",
    marginTop: 4,
  },
  driverCompany: {
    fontSize: 12,
    color: "#777",
  },
  timelineSection: {
    marginBottom: 24,
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
  contentContainer: {
    paddingBottom: 40,
  },
  timelineRow: {
    flexDirection: "row",
    marginTop: 16,
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
