import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { useSession } from '@/lib/useSession';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ACTIVE = '#a03246';
const INACTIVE = '#9a8e85';

/**
 * Three tabs. Saved, Activity and a Notifications bell existed as designs but
 * have no endpoint behind them, so they were removed rather than shipped as UI
 * that could never load.
 */
function TabIcon({
  active,
  icon,
  focused,
}: {
  active: IconName;
  icon: IconName;
  focused: boolean;
}) {
  const color = focused ? ACTIVE : INACTIVE;

  return (
    <View className="h-8 w-14 items-center justify-center">
      {focused && (
        <View
          className="absolute -top-1 h-1.5 w-1.5 rounded-pill"
          style={{ backgroundColor: ACTIVE }}
        />
      )}
      <MaterialCommunityIcons name={focused ? active : icon} size={22} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { isAuthenticated } = useSession();

  // Every module the tabs read — /api/users, /api/places, /api/friends — sits
  // behind requireAuth on the server. Entering without a token meant a wall of
  // 401s and a client that cleared the stored session, so the gate is here
  // rather than discovered one failed query at a time.
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontFamily: 'Sora_500Medium',
          fontSize: 10,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#fdfaf4',
          borderTopColor: '#e0d2b4',
          borderTopWidth: 1,
          height: 62,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <TabIcon active="map" icon="map-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circle',
          tabBarIcon: ({ focused }) => (
            <TabIcon active="account-group" icon="account-group-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon active="account-circle" icon="account-circle-outline" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
