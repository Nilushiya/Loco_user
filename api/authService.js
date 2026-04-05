import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { ENDPOINTS } from "../constants/Config";
import { LATEST_ORDER_ID_KEY, USER_ID_KEY } from "../constants/train";
import {
  authFailure,
  authSuccess,
  logout,
  startLoading,
} from "../redux/slices/authSlice";
import apiClient from "./client";
// import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const base64Decode = (input) => {
  let str = "";
  let i = 0;
  input = input.replace(/[^A-Za-z0-9+/=]/g, "");

  while (i < input.length) {
    const enc1 = BASE64_CHARS.indexOf(input.charAt(i++));
    const enc2 = BASE64_CHARS.indexOf(input.charAt(i++));
    const enc3 = BASE64_CHARS.indexOf(input.charAt(i++));
    const enc4 = BASE64_CHARS.indexOf(input.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    str += String.fromCharCode(chr1);
    if (enc3 !== 64) {
      str += String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      str += String.fromCharCode(chr3);
    }
  }

  return str;
};

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const decoded = base64Decode(padded);
    const percentEncoded = decoded
      .split("")
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join("");
    return JSON.parse(decodeURIComponent(percentEncoded));
  } catch (error) {
    console.warn("Unable to decode auth token payload", error);
    return null;
  }
};

const extractToken = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.toLowerCase().startsWith("bearer ")) {
      return trimmed.slice(7).trim();
    }
    return trimmed;
  }
  if (typeof value === "object") {
    return (
      extractToken(value.token) ??
      extractToken(value.jwt) ??
      extractToken(value.idToken) ??
      extractToken(value.data) ??
      extractToken(value.payload) ??
      extractToken(value.result) ??
      extractToken(value.accessToken) ??
      extractToken(value.access_token) ??
      extractToken(value.authToken)
    );
  }
  return null;
};

const toObject = (value) => (value && typeof value === "object" ? value : null);

const normalizeAuthResponse = (response) => {
  const rawPayload = response?.data;
  const headerToken = extractToken(
    response?.headers?.authorization ?? response?.headers?.Authorization,
  );
  const token = extractToken(rawPayload) ?? headerToken;
  const decoded = token ? decodeJwtPayload(token) : null;

  const responsePayload =
    toObject(rawPayload?.data) ??
    toObject(rawPayload?.payload) ??
    toObject(rawPayload?.user) ??
    toObject(rawPayload?.result) ??
    toObject(rawPayload);

  const mergedPayload =
    decoded || responsePayload
      ? { ...(decoded ?? {}), ...(responsePayload ?? {}) }
      : null;

  const explicitRole =
    responsePayload?.role ??
    responsePayload?.data?.role ??
    responsePayload?.roles?.[0] ??
    responsePayload?.data?.roles?.[0] ??
    rawPayload?.role ??
    rawPayload?.data?.role;

  const decodedRole =
    decoded?.role ?? decoded?.roles?.[0] ?? decoded?.data?.role;

  const finalPayload = mergedPayload ?? rawPayload ?? null;
  const resolvedId =
    finalPayload?.id ??
    finalPayload?._id ??
    finalPayload?.userId ??
    finalPayload?.user_id ??
    finalPayload?.uid ??
    finalPayload?.data?.id ??
    finalPayload?.data?._id ??
    finalPayload?.data?.userId ??
    finalPayload?.data?.user_id ??
    null;

  return {
    token,
    role: explicitRole ?? decodedRole ?? finalPayload?.role ?? "USER",
    userId: resolvedId,
    payload: finalPayload,
  };
};

const saveSession = async (token, role, userInfo, userId) => {
  if (!token) return;
  await Promise.all([
    SecureStore.setItemAsync("userToken", token),
    SecureStore.setItemAsync("userRole", role ?? "User"),
    userInfo
      ? SecureStore.setItemAsync("userInfo", JSON.stringify(userInfo))
      : Promise.resolve(),
    userId != null
      ? AsyncStorage.setItem(USER_ID_KEY, String(userId))
      : AsyncStorage.removeItem(USER_ID_KEY),
  ]);
};

const clearSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync("userToken"),
    SecureStore.deleteItemAsync("userRole"),
    SecureStore.deleteItemAsync("userInfo"),
    AsyncStorage.removeItem("trainDetails"),
    AsyncStorage.removeItem("deliveryStation"),
    AsyncStorage.removeItem("userEmail"),
    AsyncStorage.removeItem(USER_ID_KEY),
    AsyncStorage.removeItem(LATEST_ORDER_ID_KEY),
  ]);
};

const authService = {
  login: (credentials) => async (dispatch) => {
    dispatch(startLoading());
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH_LOGIN, credentials);
      const { token, role, userId, payload } = normalizeAuthResponse(response);

      if (!token) {
        throw new Error("Login response did not include an auth token");
      }
      await saveSession(token, role, { id: userId, role, payload }, userId);

      dispatch(authSuccess({ token, role, userId, userInfo: payload }));
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ??
        error.message ??
        "Login failed. Please try again.";
      dispatch(authFailure(errorMsg));
      throw error;
    }
  },

  register: (payloads) => async (dispatch) => {
    dispatch(startLoading());
    try {
      const response = await apiClient.post(ENDPOINTS.AUTH_REGISTER, payloads);
      const { token, role, userId, payload } = normalizeAuthResponse(response);

      if (!token) {
        throw new Error("Registration response did not include an auth token");
      }

      await saveSession(token, role, { id: userId, role, payload }, userId);
      dispatch(authSuccess({ token, role, userId, userInfo: payload }));
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      dispatch(authFailure(errorMsg));
      throw error;
    }
  },

  logout: () => async (dispatch) => {
    await clearSession();
    dispatch(logout());
  },
};

export default authService;
