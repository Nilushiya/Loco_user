import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { authSuccess } from '../redux/slices/authSlice';
import { store } from '../redux/store';

function RootLayoutNav() {
  const { token, role } = useSelector((state: any) => state.auth);
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  const colorScheme = useColorScheme();

  // 1. Check for existing session on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('userToken');
        const savedRole = await SecureStore.getItemAsync('userRole');
        const savedUserInfo = await SecureStore.getItemAsync('userInfo');
        const parsedUserInfo = savedUserInfo
          ? JSON.parse(savedUserInfo)
          : null;

        if (savedToken && savedRole) {
          // If found, hydrate Redux state
          dispatch(
            authSuccess({
              token: savedToken,
              role: savedRole,
              userId: parsedUserInfo?.id ?? null,
              userInfo: parsedUserInfo,
            }),
          );
        }
      } catch (e) {
        console.error("Failed to load token", e);
      } finally {
        setIsReady(true);
      }
    };

    bootstrapAsync();
  }, []);

  // 2. Role-Based Navigation Logic
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inUserGroup = segments[0] === '(user)';
    const inFormGroup = segments[0] === 'form';
    const effectiveRole = role ?? 'User';

    const checkInitialRoute = async () => {
      if (!token) {
        if (!inAuthGroup) {
          router.replace('/(auth)/login' as any);
        }
        return;
      }

      if (inAuthGroup) {
        router.replace('/(user)' as any);
        return;
      }

      if (effectiveRole === 'User' && !inUserGroup && !inFormGroup) {
        const station = await AsyncStorage.getItem('deliveryStation');
        if (!station) {
          router.replace('/form/train-details' as any);
        } else {
          router.replace('/(user)' as any);
        }
      }
    };
    checkInitialRoute();
  }, [token, role, isReady, segments]);

  // 3. Show a loading spinner while checking SecureStore
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      {/* <Stack.Screen name="(user)" /> */}
      {/* </Stack> */}
    </ThemeProvider>
  );
}

// Wrap the whole thing in the Redux Provider
export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
