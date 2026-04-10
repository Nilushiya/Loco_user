import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { io } from "socket.io-client";
import { TRACKING_SOCKET_URL } from "../constants/Config";
import { LOCATION_UPDATE_EVENT } from "../constants/socketEvents";

export const LOCATION_BACKGROUND_TASK_NAME = "loco:realtime-location-task";

type BackgroundLocationPayload = {
  userId: string | null;
  coords: Location.LocationObjectCoords;
  timestamp: string;
  accuracy: number;
  heading: number;
  altitude: number;
  speed: number;
  source: "background";
};

const emitBackgroundLocation = (payload: BackgroundLocationPayload) => {
  if (!TRACKING_SOCKET_URL) {
    console.warn(
      "Skipping background location emit: socket URL not configured.",
    );
    return;
  }

  const socket = io(TRACKING_SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: false,
    timeout: 5000,
  });

  const cleanup = () => {
    if (socket.connected || socket.disconnected) {
      socket.disconnect();
    }
  };

  socket.on("connect", () => {
    socket.emit(LOCATION_UPDATE_EVENT, payload);
    cleanup();
  });

  socket.on("connect_error", () => {
    cleanup();
  });

  setTimeout(cleanup, 6000);
};

type BackgroundLocationTaskData = {
  data?: { locations?: Location.LocationObject[] };
  error?: Error | null;
};

if (!TaskManager.isTaskDefined(LOCATION_BACKGROUND_TASK_NAME)) {
  TaskManager.defineTask(
    LOCATION_BACKGROUND_TASK_NAME,
    async ({
      data,
      error,
    }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {

      if (error) {
        console.error("Background location task error:", error.message);
        return;
      }

      const locations = data?.locations ?? [];
      if (!locations.length) return;

      for (const location of locations) {
        const coords = location.coords;
        if (!coords) continue;

        const payload = {
          userId: null,
          coords: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            altitude: coords.altitude ?? 0,
            accuracy: coords.accuracy ?? 0,
            heading: coords.heading ?? 0,
            speed: coords.speed ?? 0,
            altitudeAccuracy: null
          },
          timestamp: new Date().toISOString(),
          accuracy: coords.accuracy ?? 0,
          heading: coords.heading ?? 0,
          altitude: coords.altitude ?? 0,
          speed: coords.speed ?? 0,
          source: "background" as const,
        };

        emitBackgroundLocation(payload);
      }
    }
  );
}
