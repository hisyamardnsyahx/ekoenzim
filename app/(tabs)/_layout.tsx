import { Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { HapticTab } from '@/components/haptic-tab';
import { Brand } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.green,
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopColor: '#e5e7eb',
          backgroundColor: '#fff',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons name="home" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kalender"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-today" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="entry"
        options={{
          title: 'Entri',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle-outline" size={size ?? 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="monitor"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="timeline" size={size ?? 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
