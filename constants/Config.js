import { Platform } from "react-native";
/**
 * APP CONFIGURATION
 * Handles environment switching between Development and Production.
 */

// Load from .env
const WEB_API_URL = process.env.EXPO_PUBLIC_WEB_API_URL;
const MOBILE_API_URL = "http://192.168.8.197:3001";
const PROD_API_URL = process.env.EXPO_PUBLIC_PROD_API_URL; // for production server
const TRACKING_SOCKET_URL_VALUE = process.env.EXPO_PUBLIC_TRACKING_SOCKET_URL;
const TRACKING_API_URL_VALUE =
  process.env.EXPO_PUBLIC_TRACKING_API_URL ?? TRACKING_SOCKET_URL_VALUE;

// Determine current environment
const ENV = {
  apiUrl: __DEV__
    ? Platform.OS === "web"
      ? WEB_API_URL
      : MOBILE_API_URL
    : PROD_API_URL,
  envName: __DEV__ ? "Dev" : "Prod",
};

// Validation Check (Critical for Professional Apps)
// This prevents the app from running if the developer forgot to set up the .env
if (!ENV.apiUrl) {
  const missingVar = __DEV__
    ? Platform.OS === "web"
      ? "EXPO_PUBLIC_WEB_API_URL"
      : "EXPO_PUBLIC_MOBILE_API_URL"
    : "EXPO_PUBLIC_PROD_API_URL";
  const errorMsg = `CONFIG ERROR: ${missingVar} is not defined. 
  Check your .env.${__DEV__ ? "development" : "production"} file.`;

  if (__DEV__) {
    console.error(errorMsg);
  } else {
    throw new Error(errorMsg);
  }
}

if (!TRACKING_SOCKET_URL_VALUE || !TRACKING_API_URL_VALUE) {
  const trackingError = `CONFIG WARNING: Tracking URLs are missing. `
    + `Make sure EXPO_PUBLIC_TRACKING_SOCKET_URL and EXPO_PUBLIC_TRACKING_API_URL are set in your .env files.`;
  if (__DEV__) {
    console.warn(trackingError);
  } else {
    console.error(trackingError);
  }
}

// Centralized Export
export const BASE_URL = "http://192.168.8.197:3001";
export const TRACKING_SOCKET_URL = TRACKING_SOCKET_URL_VALUE;
export const TRACKING_API_URL = TRACKING_API_URL_VALUE;

export const ENDPOINTS = {
  AUTH_LOGIN: "/user/login",
  AUTH_REGISTER: "/user/register",
  ORDER_CREATE: "/order/create",
  ORDER_FETCH: "/order/user/get",

  // future routes kept for reference
  // USER_PROFILE: '/user/profile',
  // USER_DASHBOARD: '/user/dashboard',
  // DELIVERY_TASKS: '/delivery/tasks',
  // UPDATE_STATUS: '/delivery/update-status',
  // MANAGER_STATS: '/manager/dashboard',
  // STATION_LOGS: '/manager/logs',
};

// pp Theme Constants (Bonus for "Good Architecture")
// export const THEME = {
//   primary: '#6200EE',
//   secondary: '#03DAC6',
//   error: '#B00020',
//   background: {
//     light: '#FFFFFF',
//     dark: '#121212',
//   },
// };
