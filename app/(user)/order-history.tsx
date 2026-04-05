import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MOCK_ORDERS, OrderRecord, OrderStatus } from "../../utils/orderMocks";

const TAB_ITEMS: OrderStatus[] = ["Ongoing", "Completed", "Canceled"];

const formatDate = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return date.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" });
};

const OrderCard: React.FC<{
  order: OrderRecord;
  onDetails: () => void;
}> = ({ order, onDetails }) => {
  return (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardType}>{order.type}</Text>
          <Text style={styles.cardSubTitle}>{formatDate(order.date)}</Text>
        </View>
        <Text style={styles.cardAmount}>LKR {order.amount.toFixed(2)}</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{order.status}</Text>
        </View>
        <TouchableOpacity style={styles.rateButton}>
          <Text style={styles.rateButtonText}>Rate & Tip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timelineRow}>
        <View style={styles.timelineIndicator}>
          <View style={[styles.timelineDot, styles.timelineDotPrimary]} />
          <View style={styles.timelineLine} />
          <View style={[styles.timelineDot, styles.timelineDotSecondary]} />
        </View>
        <View style={styles.timelineText}>
          <Text style={styles.timelineTitle}>{order.pickup}</Text>
          <Text style={styles.timelineCaption}>
            {formatDate(order.date)} {formatTime(order.date)}
          </Text>
          <Text style={[styles.timelineTitle, { marginTop: 12 }]}>{order.dropoff}</Text>
          <Text style={styles.timelineCaption}>
            {formatDate(order.date)} {formatTime(order.date)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={onDetails}>
          <Text style={styles.detailsLink}>View Details</Text>
        </TouchableOpacity>
        <Text style={styles.cardAmountSmall}>LKR {order.amount.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default function OrderHistoryScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("Ongoing");
  const router = useRouter();

  const filteredOrders = useMemo(
    () => MOCK_ORDERS.filter((order) => order.status === activeTab),
    [activeTab],
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Activities</Text>
      </View>

      <View style={styles.tabRow}>
        {TAB_ITEMS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No orders for {activeTab} yet.</Text>
          </View>
        )}

        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onDetails={() => router.push(`/(user)/order-detail/${order.id}`)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 12,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 18,
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: "#ff9a00",
  },
  tabText: {
    fontSize: 16,
    color: "#777",
  },
  tabTextActive: {
    color: "#111",
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardType: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  cardSubTitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  cardAmountSmall: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#f3f3f3",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: "#111",
    fontWeight: "700",
  },
  rateButton: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rateButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
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
  cardFooter: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsLink: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1063f7",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#777",
  },
});
