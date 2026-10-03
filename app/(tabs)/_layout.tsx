import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ACTIVE = '#8e2c39';
const INACTIVE = '#9a8e85';

/** Active tab wears an oxblood dot above its glyph, as in the design. */
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
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => (
            <TabIcon active="bookmark" icon="bookmark-outline" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => (
            <TabIcon active="lightning-bolt" icon="lightning-bolt-outline" focused={focused} />
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
