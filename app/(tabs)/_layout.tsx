import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs, useRouter } from "expo-router";
import { Pressable, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Building2, LogOut, LayoutGrid, FolderOpen, BarChart3 } from "lucide-react-native";

import Colors from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "BizHub",
          tabBarIcon: ({ color }) => <Building2 size={24} color={color} />,
          tabBarLabel: "Home",
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <LogOut size={20} color={Colors.primary} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <LayoutGrid size={24} color={color} />,
          tabBarLabel: "Tasks",
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title: "Files",
          tabBarIcon: ({ color }) => <FolderOpen size={24} color={color} />,
          tabBarLabel: "Files",
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          tabBarLabel: "Reports",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
  },
  logoutText: {
    marginLeft: 4,
    color: Colors.primary,
    fontWeight: '500',
  },
});