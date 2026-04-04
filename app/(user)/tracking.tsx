import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocationTracking } from "../../hooks/useLocationTracking";

const statusPalette: Record<string, string> = {
  idle: "#999",
  connecting: "#f59d00",
  connected: "#00a86b",
  disconnected: "#f44336",
  error: "#d32f2f",
};

const TrackingScreen = () => {
  const router = useRouter();
  const { trackingState, startTracking, stopTracking, trackingAvailable } =
    useLocationTracking();

  const locationCoords = trackingState.lastLocation?.coords;
  const isConnecting = trackingState.socketStatus === "connecting";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.title}>Real-time GPS Tracking</Text>
            <Text style={styles.subtitle}>
              {trackingState.isMoving ? "High accuracy while moving" : "Battery savers active"}
            </Text>
          </View>

          <View style={styles.headerFill} />
        </View>

        {!trackingAvailable && (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Tracking not configured</Text>
            <Text style={styles.messageBody}>
              Make sure EXPO_PUBLIC_TRACKING_SOCKET_URL and EXPO_PUBLIC_TRACKING_API_URL
              are set in your environment before enabling the live tracker.
            </Text>
          </View>
        )}

        {trackingState.errorMessage && (
          <View style={styles.alertCard}>
            <Text style={styles.alertText}>{trackingState.errorMessage}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Socket</Text>
            <View style={styles.statusValueRow}>
              <Text
                style={[
                  styles.statusValue,
                  { color: statusPalette[trackingState.socketStatus] ?? "#333" },
                ]}
              >
                {trackingState.socketStatus}
              </Text>
              {isConnecting && <ActivityIndicator size="small" color="#f59d00" />}
            </View>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>GPS</Text>
            <Text style={styles.statusValue}>
              {trackingState.servicesEnabled ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>

        <View style={styles.coordinatesCard}>
          <Text style={styles.sectionTitle}>Latest Location</Text>
          {locationCoords ? (
            <>
              <Text style={styles.coordsLine}>
                Lat: {locationCoords.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordsLine}>
                Lng: {locationCoords.longitude.toFixed(6)}
              </Text>
              <Text style={styles.coordsLine}>
                Accuracy: {locationCoords.accuracy?.toFixed(1) ?? "N/A"} m
              </Text>
              <Text style={styles.coordsLine}>
                Sent: {trackingState.lastSentAt ?? "Waiting for update"}
              </Text>
            </>
          ) : (
            <Text style={styles.coordsLine}>Waiting for a GPS fix...</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, trackingState.isTracking && styles.buttonDisabled]}
            onPress={startTracking}
            disabled={trackingState.isTracking || !trackingAvailable}
          >
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              !trackingState.isTracking && styles.buttonDisabled,
            ]}
            onPress={stopTracking}
            disabled={!trackingState.isTracking}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          <View style={styles.permissionList}>
            <Text style={styles.permissionLine}>
              Foreground: {trackingState.permission ?? "pending"}
            </Text>
            <Text style={styles.permissionLine}>
              Background: {trackingState.backgroundPermission ?? "pending"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Restaurants (within 5 km)</Text>
          <FlatList
            data={trackingState.nearbyRestaurants}
            keyExtractor={(item) => `${item.id}-${item.latitude}-${item.longitude}`}
            ListEmptyComponent={<Text style={styles.emptyState}>No nearby restaurants yet.</Text>}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }) => (
              <View style={styles.restaurantCard}>
                <View>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.restaurantDetail}>{item.address ?? "Location only"}</Text>
                  <Text style={styles.restaurantDetail}>
                    Distance: {item.distanceMeters?.toFixed(0) ?? "-"} m
                  </Text>
                </View>
                <Ionicons name="location-outline" size={20} color="#FF7A00" />
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackingScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  headerFill: {
    width: 24,
  },
  messageCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  messageTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  messageBody: {
    fontSize: 13,
    color: "#333",
  },
  alertCard: {
    backgroundColor: "#fdecea",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  alertText: {
    color: "#c62828",
    fontSize: 13,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: "#666",
  },
  statusValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  statusValue: {
    fontWeight: "700",
    fontSize: 16,
    marginRight: 4,
  },
  coordinatesCard: {
    backgroundColor: "#eef7ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  coordsLine: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: "#FF7A00",
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  permissionList: {
    backgroundColor: "#fefefe",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  permissionLine: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  restaurantCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    marginBottom: 10,
  },
  restaurantName: {
    fontWeight: "600",
    fontSize: 14,
  },
  restaurantDetail: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    fontSize: 13,
    color: "#777",
  },
});
