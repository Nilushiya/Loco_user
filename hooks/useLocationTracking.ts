import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { io, type Socket } from "socket.io-client";
import { TRACKING_API_URL, TRACKING_SOCKET_URL } from "../constants/Config";
import { LOCATION_UPDATE_EVENT } from "../constants/socketEvents";
import { useAppSelector } from "../redux/hooks";
import { LOCATION_BACKGROUND_TASK_NAME } from "../services/backgroundLocationTask";

const REPORT_INTERVAL_MS = 10000;
const MOVING_SPEED_THRESHOLD = 0.75;
const LOCATION_QUEUE_LIMIT = 40;

export type SocketConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface RestaurantPreview {
  id: string;
  name: string;
  address?: string;
  category?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
}

type TrackingPayload = {
  userId: string | null;
  coords: Location.LocationObjectCoords;
  timestamp: string;
  accuracy: number;
  heading: number;
  altitude: number;
  speed: number;
  source: "foreground" | "background";
};

interface TrackingState {
  permission: Location.PermissionStatus | null;
  backgroundPermission: Location.PermissionStatus | null;
  servicesEnabled: boolean;
  errorMessage: string | null;
  lastLocation: Location.LocationObject | null;
  isMoving: boolean;
  isTracking: boolean;
  socketStatus: SocketConnectionStatus;
  lastSentAt: string | null;
  nearbyRestaurants: RestaurantPreview[];
  lastNearbyFetch: string | null;
}

const INITIAL_TRACKING_STATE: TrackingState = {
  permission: null,
  backgroundPermission: null,
  servicesEnabled: true,
  errorMessage: null,
  lastLocation: null,
  isMoving: false,
  isTracking: false,
  socketStatus: "idle",
  lastSentAt: null,
  nearbyRestaurants: [],
  lastNearbyFetch: null,
};

export const useLocationTracking = () => {
  const userId = useAppSelector((state) => state.auth.userId);
  const [trackingState, setTrackingState] = useState(INITIAL_TRACKING_STATE);
  const socketRef = useRef<Socket | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );
  const pendingLocationsRef = useRef<TrackingPayload[]>([]);
  const lastSentAtRef = useRef(0);
  const movementRef = useRef(false);
  const accuracyRef = useRef<Location.LocationAccuracy>(
    Location.Accuracy.Balanced,
  );
  const locationHandlerRef = useRef<
    ((location: Location.LocationObject) => void) | null
  >(null);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const isTrackingRef = useRef(false);

  const updateTrackingState = useCallback((patch: Partial<TrackingState>) => {
    if (!isMountedRef.current) return;
    setTrackingState((prev) => ({ ...prev, ...patch }));
  }, []);

  const flushPendingLocations = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;
    while (pendingLocationsRef.current.length) {
      const next = pendingLocationsRef.current.shift();
      if (next) {
        socket.emit(LOCATION_UPDATE_EVENT, next);
      }
    }
  }, []);

  const enqueueLocation = useCallback((payload: TrackingPayload) => {
    if (pendingLocationsRef.current.length >= LOCATION_QUEUE_LIMIT) {
      pendingLocationsRef.current.shift();
    }
    pendingLocationsRef.current.push(payload);
  }, []);

  const connectSocket = useCallback(() => {
    if (!TRACKING_SOCKET_URL) {
      updateTrackingState({
        socketStatus: "error",
        errorMessage: "Tracking socket URL is missing. Check your config.",
      });
      return;
    }

    if (socketRef.current) {
      const existing = socketRef.current;
      if (existing.connected) {
        flushPendingLocations();
      } else {
        existing.connect();
      }
      return;
    }

    const socket = io(TRACKING_SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      autoConnect: false,
    });

    socketRef.current = socket;
    updateTrackingState({ socketStatus: "connecting" });

    socket.on("connect", () => {
      updateTrackingState({ socketStatus: "connected", errorMessage: null });
      flushPendingLocations();
    });

    socket.on("disconnect", (reason) => {
      // Fixed: Use string conversion or casting to handle the DisconnectReason type comparison
      const isManualClose = String(reason) === "io client was closed";
      updateTrackingState({
        socketStatus: "disconnected",
        errorMessage: isManualClose
          ? null
          : "Socket disconnected. Will retry automatically.",
      });
    });

    socket.on("connect_error", (error) => {
      updateTrackingState({
        socketStatus: "error",
        errorMessage: error?.message ?? "Unable to reach tracking backend.",
      });
    });

    socket.on("reconnect_attempt", () => {
      updateTrackingState({ socketStatus: "connecting" });
    });

    socket.connect();
  }, [flushPendingLocations, updateTrackingState]);

  const fetchNearbyRestaurants = useCallback(
    async (coords: Location.LocationObjectCoords) => {
      if (!TRACKING_API_URL) return;

      fetchAbortControllerRef.current?.abort();
      const controller = new AbortController();
      fetchAbortControllerRef.current = controller;

      try {
        const response = await fetch(
          `${TRACKING_API_URL}/restaurants/nearby?lat=${coords.latitude}&lng=${coords.longitude}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Nearby request failed");

        const payload = await response.json();
        updateTrackingState({
          nearbyRestaurants: payload?.restaurants ?? [],
          lastNearbyFetch: new Date().toISOString(),
        });
      } catch (error) {
        if ((error as any).name === "AbortError") return;
        console.warn("Nearby restaurant lookup failed", error);
      }
    },
    [updateTrackingState],
  );

  const sendLocation = useCallback(
    async (
      location: Location.LocationObject,
      source: "foreground" | "background",
    ) => {
      const now = Date.now();
      if (now - lastSentAtRef.current < REPORT_INTERVAL_MS) return;
      lastSentAtRef.current = now;

      const { coords } = location;
      // Fixed: Explicitly added missing altitudeAccuracy
      const payload: TrackingPayload = {
        userId: userId ?? null,
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? 0,
          altitude: coords.altitude ?? 0,
          heading: coords.heading ?? 0,
          speed: coords.speed ?? 0,
          altitudeAccuracy: coords.altitudeAccuracy ?? 0,
        },
        timestamp: new Date().toISOString(),
        accuracy: coords.accuracy ?? 0,
        heading: coords.heading ?? 0,
        altitude: coords.altitude ?? 0,
        speed: coords.speed ?? 0,
        source,
      };

      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit(LOCATION_UPDATE_EVENT, payload);
      } else {
        enqueueLocation(payload);
      }

      updateTrackingState({
        lastLocation: location,
        lastSentAt: payload.timestamp,
      });

      await fetchNearbyRestaurants(payload.coords);
    },
    [enqueueLocation, fetchNearbyRestaurants, updateTrackingState, userId],
  );

  const restartForegroundWatcher = useCallback(async () => {
    if (!isTrackingRef.current) return;

    try {
      // Fixed: Removed 'showsBackgroundLocationIndicator' from Foreground watcher options
      const options: Location.LocationOptions = {
        accuracy: accuracyRef.current,
        timeInterval: REPORT_INTERVAL_MS,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      };

      const subscription = await Location.watchPositionAsync(
        options,
        (location) => {
          locationHandlerRef.current?.(location);
        },
      );
      locationSubscriptionRef.current?.remove();
      locationSubscriptionRef.current = subscription;
    } catch (error) {
      console.error("Foreground location watcher failed", error);
      updateTrackingState({
        errorMessage: "Foreground GPS access is currently unavailable.",
      });
    }
  }, [updateTrackingState]);

  const ensureBackgroundUpdates = useCallback(async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_BACKGROUND_TASK_NAME,
      );
      if (!hasStarted) {
        await Location.startLocationUpdatesAsync(
          LOCATION_BACKGROUND_TASK_NAME,
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: REPORT_INTERVAL_MS,
            distanceInterval: 0,
            deferredUpdatesInterval: REPORT_INTERVAL_MS,
            showsBackgroundLocationIndicator: true, // This is valid for background updates
            pausesUpdatesAutomatically: true,
            foregroundService: {
              notificationTitle: "Loco Live Tracking",
              notificationBody: "Background GPS enabled",
              notificationColor: "#FF7A00",
            },
          },
        );
      }
    } catch (error) {
      console.warn("Background location registration failed", error);
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (!isTrackingRef.current && !socketRef.current) {
      updateTrackingState({ isTracking: false, socketStatus: "disconnected" });
      return;
    }

    isTrackingRef.current = false;
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;

    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        LOCATION_BACKGROUND_TASK_NAME,
      );
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_BACKGROUND_TASK_NAME);
      }
    } catch (error) {
      console.warn("Failed to stop background updates", error);
    }

    if (socketRef.current) {
      socketRef.current.off();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    pendingLocationsRef.current = [];
    lastSentAtRef.current = 0;
    fetchAbortControllerRef.current?.abort();

    updateTrackingState({
      isTracking: false,
      socketStatus: "disconnected",
      errorMessage: null,
    });
  }, [updateTrackingState]);

  const verifyLocationServices = useCallback(async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        await stopTracking();
        updateTrackingState({
          servicesEnabled: false,
          errorMessage: "Location services are disabled.",
        });
        return;
      }
      updateTrackingState({ servicesEnabled: true });
    } catch (error) {
      console.error("Unable to verify GPS availability", error);
    }
  }, [stopTracking, updateTrackingState]);

  const trackMovement = useCallback(
    (location: Location.LocationObject) => {
      const speed = location.coords.speed ?? 0;
      const movingNow = speed >= MOVING_SPEED_THRESHOLD;
      if (movingNow !== movementRef.current) {
        movementRef.current = movingNow;
        updateTrackingState({ isMoving: movingNow });
        const desiredAccuracy = movingNow
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Lowest;
        if (desiredAccuracy !== accuracyRef.current) {
          accuracyRef.current = desiredAccuracy;
          restartForegroundWatcher();
        }
      }

      sendLocation(location, "foreground");
    },
    [restartForegroundWatcher, sendLocation, updateTrackingState],
  );

  useEffect(() => {
    locationHandlerRef.current = trackMovement;
  }, [trackMovement]);

  const startTracking = useCallback(async () => {
    if (isTrackingRef.current) return;

    if (!TRACKING_SOCKET_URL || !TRACKING_API_URL) {
      updateTrackingState({
        errorMessage: "Tracking backend is not configured.",
        socketStatus: "error",
      });
      return;
    }

    try {
      updateTrackingState({ errorMessage: null, socketStatus: "connecting" });

      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();
      updateTrackingState({ permission: foregroundStatus });
      if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
        updateTrackingState({
          errorMessage: "Foreground location permission denied.",
          socketStatus: "idle",
        });
        return;
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      // Fixed: Pass object to updateTrackingState instead of functional update
      updateTrackingState({
        backgroundPermission: backgroundStatus,
        errorMessage:
          backgroundStatus !== Location.PermissionStatus.GRANTED
            ? "Background permission denied. Background updates will pause once the app is closed."
            : null,
      });

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        updateTrackingState({
          servicesEnabled: false,
          errorMessage: "GPS is disabled.",
          socketStatus: "idle",
        });
        return;
      }

      isTrackingRef.current = true;
      updateTrackingState({ isTracking: true, servicesEnabled: true });

      connectSocket();
      await restartForegroundWatcher();
      await ensureBackgroundUpdates();
    } catch (error) {
      console.error("Live tracking failed to start", error);
      isTrackingRef.current = false;
      updateTrackingState({
        isTracking: false,
        socketStatus: "error",
        errorMessage: "Unable to start live tracking right now.",
      });
    }
  }, [
    connectSocket,
    ensureBackgroundUpdates,
    restartForegroundWatcher,
    updateTrackingState,
  ]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopTracking();
    };
  }, [stopTracking]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        verifyLocationServices();
        restartForegroundWatcher();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [restartForegroundWatcher, verifyLocationServices]);

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  return {
    trackingState,
    startTracking,
    stopTracking,
    trackingAvailable: Boolean(TRACKING_SOCKET_URL && TRACKING_API_URL),
  };
};
