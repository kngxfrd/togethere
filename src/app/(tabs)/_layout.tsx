import { Tabs, router, usePathname } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  Compass,
  MessageCircle,
  Clock,
  UserCircle,
} from "lucide-react-native";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isAccountScreen = pathname.includes("/account");

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#111827",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: {
            height: 74,
            paddingBottom: 10,
            paddingTop: 6,
            borderTopWidth: 0,
            borderTopColor: "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Home size={size ?? 21} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => (
              <Compass size={size ?? 21} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size ?? 21} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="rides"
          options={{
            title: "Rides",
            tabBarIcon: ({ color, size }) => (
              <Clock size={size ?? 21} color={color} />
            ),
          }}
        />


        <Tabs.Screen
          name="account"
          options={{
            href: null,
          }}
        />
      </Tabs>


      {!isAccountScreen && (
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/account")}
          style={{
            top: insets.top + 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
          className="absolute right-5 w-12 h-12 mt-2 rounded-full bg-gray-100 items-center justify-center"
          activeOpacity={0.7}
        >
          <UserCircle size={26} color="#111827" />
        </TouchableOpacity>
      )}
    </View>
  );
}
