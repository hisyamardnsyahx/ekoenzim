import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { Brand } from '@/constants/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.slate,
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopColor: '#e2e8f0',
          backgroundColor: '#fff',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="laporan"
        options={{
          title: 'Laporan',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="description" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Pengguna',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size ?? 20} color={color} />
          ),
        }}
      />
          <Tabs.Screen
        name="chat"
        options={{
          title: 'Pesan',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" size={size ?? 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


