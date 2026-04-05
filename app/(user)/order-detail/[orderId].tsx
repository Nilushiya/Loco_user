import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_ORDERS } from "../../../utils/orderMocks";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("en-LK", {
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

  const order = useMemo(
    () => MOCK_ORDERS.find((o) => o.id === params.orderId),
    [params.orderId],
  );

  if (!order) {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyText}>Order not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip ID - {order.tripId}</Text>
      </View>
      <Text style={styles.subHeader}>
        {order.userName} {order.userPhone}
      </Text>

      <View style={styles.overviewCard}>
        <View style={styles.overviewLeft}>
          <Text style={styles.overviewType}>{order.type}</Text>
          <Text style={styles.subHeader}>{formatDate(order.date)}</Text>
        </View>
        {order.driver && (
          <View style={styles.driverCard}>
            <Text style={styles.driverName}>{order.driver.name}</Text>
            <Text style={styles.driverVehicle}>{order.driver.vehicle}</Text>
            <Text style={styles.driverRating}>Rating {order.driver.rating}</Text>
            <Text style={styles.driverCompany}>{order.driver.company}</Text>
          </View>
        )}
      </View>

      <View style={styles.timelineSection}>
        <OrderStatusRow label="Pickup" value={order.pickup} />
        <Text style={styles.timelineCaption}>
          {formatTime(order.date)} - {formatDate(order.date)}
        </Text>
        <OrderStatusRow label="Dropoff" value={order.dropoff} />
        <Text style={styles.timelineCaption}>
          {formatTime(order.date)} - {formatDate(order.date)}
        </Text>
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
        {order.items.map((item) => (
          <View key={item.name} style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {item.name} x{item.quantity}
            </Text>
            <Text style={styles.detailValue}>LKR {item.price.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <OrderStatusRow label="Sub Total" value={"+ " + formatLKR(order.subtotal)} />
        <OrderStatusRow label="Delivery Fee" value={"+ " + formatLKR(order.deliveryFee)} />
        <View style={styles.divider} />
        <OrderStatusRow label="Paid by" value={order.paymentMethod} />
        <OrderStatusRow label="Total" value={formatLKR(order.amount)} />

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
  `LKR ${value.toLocaleString("en-LK", {
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
  timelineCaption: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
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


