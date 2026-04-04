import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { restaurants } from "./data/restaurants.js";
import { getDistanceInMeters } from "./utils/geo.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const GEO_RADIUS_METERS = Number(process.env.GEO_RADIUS_METERS ?? 5000);
const LOCATION_EVENT = process.env.LOCATION_EVENT ?? "location:update";

const app = express();
app.use(cors());
app.use(express.json());

const latestLocations = new Map();

app.get("/restaurants/nearby", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res
      .status(400)
      .json({ error: "Missing lat/lng query parameters." });
  }

  const nearby = restaurants
    .map((restaurant) => {
      const distanceMeters = getDistanceInMeters(
        lat,
        lng,
        restaurant.latitude,
        restaurant.longitude
      );
      return { ...restaurant, distanceMeters };
    })
    .filter((restaurant) => restaurant.distanceMeters <= GEO_RADIUS_METERS)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));

  return res.json({ restaurants: nearby });
});

app.get("/locations/latest/:userId", (req, res) => {
  const entry = latestLocations.get(req.params.userId);
  if (!entry) {
    return res.status(404).json({ error: "No location found for this user." });
  }
  return res.json({ location: entry });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on(LOCATION_EVENT, (payload) => {
    if (!payload || !payload.coords) {
      return;
    }
    const { userId } = payload;
    const storedEntry = {
      ...payload,
      timestamp: new Date().toISOString(),
    };
    latestLocations.set(userId ?? socket.id, storedEntry);
  });
});

server.listen(PORT, () => {
  console.log(`Tracking server listening on http://localhost:${PORT}`);
  console.log(`Listening for "${LOCATION_EVENT}" socket events.`);
});
