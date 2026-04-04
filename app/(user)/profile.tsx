import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../../api/authService';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/theme';
import { TRAIN_DETAILS_KEY } from '../../constants/train';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

interface TrainDetails {
  trainNumber?: string;
  departure?: string;
  arrival?: string;
  seatNumber?: string;
}

export default function Profile() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { userInfo, role } = useAppSelector((state) => state.auth);
  const [trainDetails, setTrainDetails] = useState<TrainDetails | null>(null);
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrainDetails = async () => {
      const raw = await AsyncStorage.getItem(TRAIN_DETAILS_KEY);
      if (raw) {
        try {
          setTrainDetails(JSON.parse(raw));
        } catch (e) {
          console.warn('Failed to parse train info', e);
        }
      }
      const savedEmail = await AsyncStorage.getItem("userEmail");
      if (savedEmail) {
        setFallbackEmail(savedEmail);
      }
      setLoading(false);
    };
    loadTrainDetails();
  }, []);

  const handleLogout = async () => {
    await dispatch<any>(authService.logout());
    router.replace('/(auth)/login');
  };

  
  // const email =
  //   userInfo?.email ?? userInfo?.username ?? fallbackEmail ?? 'Not provided';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subTitle}>Hi, There...!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            {/* <Text style={styles.value}>{email}</Text> */}
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{role ?? 'Traveler'}</Text>
          </View>
          {/* {userInfo?.phoneNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{userInfo.phoneNumber}</Text>
            </View>
          )} */}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Journey</Text>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.default.primary} />
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Train</Text>
                <Text style={styles.value}>
                  {trainDetails?.trainNumber ?? 'Not saved'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Route</Text>
                <Text style={styles.value}>
                  {trainDetails?.departure ?? '—'} → {trainDetails?.arrival ?? '—'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Seat</Text>
                <Text style={styles.value}>
                  {trainDetails?.seatNumber ?? 'Not saved'}
                </Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.default.secondary,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  badge: {
    backgroundColor: Colors.default.white,
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.default.text,
  },
  subTitle: {
    marginTop: 4,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: Colors.default.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    color: '#666',
    fontSize: 14,
  },
  value: {
    color: Colors.default.text,
    fontWeight: '600',
    fontSize: 14,
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutBtn: {
    backgroundColor: '#111',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
