import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const PRIMARY = "#FF7A00";

export default function OrderPlacementScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={100} color={PRIMARY} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(700).delay(200)} style={styles.textContainer}>
          <Text style={styles.title}>Order Placed!</Text>
          <Text style={styles.subtitle}>
            Your order has been confirmed and is being prepared by the restaurant. You will be notified of updates soon.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.btnContainer}>
          <TouchableOpacity 
            style={styles.homeBtn} 
            onPress={() => router.replace("/(user)")}>
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  iconCircle: {
    marginBottom: 30,
    backgroundColor: "#FEEDE6",
    borderRadius: 100,
    padding: 20,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
    textAlign: "center",
  },
  btnContainer: {
    marginTop: 50,
    width: "100%",
  },
  homeBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  homeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
