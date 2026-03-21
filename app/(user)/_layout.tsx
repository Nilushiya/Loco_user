import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UserLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#FF7A00", } }
     >
      <Tabs.Screen  
        name="index" // This is the Dashboard
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarStyle: {
            paddingTop: 5,
            backgroundColor: "#FEEDE6", // Tab bar background
          },
          tabBarLabel: () => null, // Hide the label
          tabBarInactiveTintColor: "black",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          headerShown: false,
          tabBarStyle: {
            paddingTop: 5,
           backgroundColor: "#FEEDE6", // Tab bar background
          },
          tabBarLabel: () => null, // Hide the label
          tabBarInactiveTintColor: "black",
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarStyle: {
            paddingTop: 5,
           backgroundColor: "#FEEDE6", // Tab bar background
         },
          tabBarLabel: () => null, // Hide the label
          tabBarInactiveTintColor: "black",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // hide from tab bar but keep route available
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search-results"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
