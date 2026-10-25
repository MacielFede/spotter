import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";

export default function TabsLayout() {
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tokens.surface,
          borderTopColor: tokens.border,
        },
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.textSecondary,
        sceneStyle: { backgroundColor: tokens.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: "Plans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color as string} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
