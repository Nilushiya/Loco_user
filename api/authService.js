import apiClient from './client';
import { ENDPOINTS } from '../constants/Config';
import {
  startLoading,
  authSuccess,
  authFailure,
  logout,
} from '../redux/slices/authSlice';
import * as SecureStore from 'expo-secure-store';

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const base64Decode = (input) => {
  let str = '';
  let i = 0;
  input = input.replace(/[^A-Za-z0-9+/=]/g, '');

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
  if (!token || typeof token !== 'string') return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = base64Decode(padded);
    const percentEncoded = decoded
      .split('')
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('');
    return JSON.parse(decodeURIComponent(percentEncoded));
  } catch (error) {
    console.warn('Unable to decode auth token payload', error);
    return null;
  }
};

const extractToken = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return (
      extractToken(value.token) ??
      extractToken(value.data) ??
      extractToken(value.accessToken) ??
      extractToken(value.authToken)
    );
  }
  return null;
};

const normalizeAuthResponse = (response) => {
  const payload = response?.data;
  const token = extractToken(payload);
  const explicitRole =
    typeof payload === 'object' && payload !== null
      ? payload.role ??
        payload?.data?.role ??
        payload?.roles?.[0] ??
        payload?.data?.roles?.[0]
      : undefined;

  const decoded = token ? decodeJwtPayload(token) : null;
  const decodedRole =
    decoded?.role ?? decoded?.roles?.[0] ?? decoded?.data?.role;
  const decodedId =
    decoded?.id ??
    decoded?.userId ??
    decoded?.data?.id ??
    decoded?.data?.userId ??
    payload?.id ??
    payload?.data?.id;

  return {
    token,
    role: explicitRole ?? decodedRole ?? 'USER',
    userId: decodedId ?? null,
    payload: decoded ?? payload,
  };
};

const saveSession = async (token, role, userInfo) => {
  if (!token) return;
  await Promise.all([
    SecureStore.setItemAsync('userToken', token),
    SecureStore.setItemAsync('userRole', role ?? 'User'),
    userInfo
      ? SecureStore.setItemAsync('userInfo', JSON.stringify(userInfo))
      : Promise.resolve(),
  ]);
};

const clearSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync('userToken'),
    SecureStore.deleteItemAsync('userRole'),
    SecureStore.deleteItemAsync('userInfo'),
  ]);
};

const authService = {
  login: (credentials) => async (dispatch) => {
    dispatch(startLoading());

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH_LOGIN, credentials);
      const { token, role, userId, payload } = normalizeAuthResponse(response);

      if (!token) {
        throw new Error('Missing auth token');
      }
      
      await saveSession(token, role, { id: userId, role, payload });
      dispatch(authSuccess({ token, role, userId, userInfo: payload }));
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Login failed. Please try again.';
      dispatch(authFailure(errorMsg));
      throw error;
    }
  },

  register: (payload) => async (dispatch) => {
    dispatch(startLoading());

    try {
      const response = await apiClient.post(ENDPOINTS.AUTH_REGISTER, payload);
      const { token, role, userId, payload } = normalizeAuthResponse(response);

      if (!token) {
        throw new Error('Missing auth token');
      }

      await saveSession(token, role, { id: userId, role, payload });
      dispatch(authSuccess({ token, role, userId, userInfo: payload }));
      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
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
