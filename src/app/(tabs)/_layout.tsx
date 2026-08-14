import { Tabs, router, usePathname } from "expo-router";
import { createContext, useContext, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Home,
  Compass,
  MessageCircle,
  Clock,
  Menu,
  Camera,
  ChevronRight,
  UserCircle2,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  MapPin,
  Settings as SettingsIcon,
  Star,
} from "lucide-react-native";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

// Shared with other tab screens (e.g. chats.tsx) so they can tell this
// layout to hide the tab bar + hamburger button without needing a route change.
type ChromeContextType = {
  hideChrome: boolean;
  setHideChrome: (hide: boolean) => void;
};
export const ChromeContext = createContext<ChromeContextType>({
  hideChrome: false,
  setHideChrome: () => {},
});
export const useChrome = () => useContext(ChromeContext);

const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

// Each item now carries an optional route. Items without one just close the panel for now.
const MENU_ITEMS = [
  { label: "Profile", Icon: UserCircle2, route: "/(tabs)/account" },
  { label: "Settings", Icon: SettingsIcon, route: "/(tabs)/settings" },
] as const;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isAccountScreen = pathname.includes("/account");
  const isSettingsScreen = pathname.includes("/settings");
  const { user } = useAuth(); // expect { name, rating } shape
  const role = useUserRole();
  const isDriver = role === "driver";
  const { isDark } = useTheme();

  const [hideChromeFromChild, setHideChromeFromChild] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  const hideChrome = isAccountScreen || isSettingsScreen || hideChromeFromChild;

  const openPanel = () => {
    setPanelOpen(true);
    translateX.setValue(PANEL_WIDTH);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(translateX, {
      toValue: PANEL_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setPanelOpen(false));
  };

  const handleMenuPress = (route: string | null) => {
    closePanel();
    if (route) {
      // Slight delay so the panel finishes closing before navigating,
      // avoiding a jarring cut where the panel disappears mid-slide.
      setTimeout(() => router.push(route as any), 200);
    }
  };

  return (
    <ChromeContext.Provider
      value={{
        hideChrome: hideChromeFromChild,
        setHideChrome: setHideChromeFromChild,
      }}
    >
      <View className="flex-1">
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#C0392B",
            tabBarInactiveTintColor: isDark ? "#6b7280" : "#9CA3AF",
            tabBarStyle: hideChrome
              ? { display: "none" }
              : {
                  height: 74,
                  paddingBottom: 10,
                  paddingTop: 6,
                  borderTopWidth: 0,
                  borderTopColor: "transparent",
                  backgroundColor: isDark ? "#0d0d1a" : "#ffffff",
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

          {/* Explore: commuter only. Route stays registered for drivers
              (href: null) so it doesn't 404 if something ever links to it,
              it's just pulled out of the tab bar. */}
          {isDriver ? (
            <Tabs.Screen name="explore" options={{ href: null }} />
          ) : (
            <Tabs.Screen
              name="explore"
              options={{
                title: "Explore",
                tabBarIcon: ({ color, size }) => (
                  <Compass size={size ?? 21} color={color} />
                ),
              }}
            />
          )}

          <Tabs.Screen
            name="chats"
            options={{
              title: "Chats",
              tabBarIcon: ({ color, size }) => (
                <MessageCircle size={size ?? 21} color={color} />
              ),
            }}
          />

          {/* Rides: shown for everyone, but declared second for drivers
              so it takes Explore's old tab-bar position. */}
          <Tabs.Screen
            name="rides"
            options={{
              title: "Rides",
              tabBarIcon: ({ color, size }) => (
                <Clock size={size ?? 21} color={color} />
              ),
            }}
          />

          <Tabs.Screen name="account" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
        </Tabs>

        {/* Hamburger button replaces the old avatar button */}
        {!hideChrome && (
          <TouchableOpacity
            onPress={openPanel}
            style={{
              top: insets.top + 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
            className="absolute right-5 w-12 h-12 mt-1 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center"
            activeOpacity={0.7}
          >
            <Menu size={24} color={isDark ? "#f3f4f6" : "#111827"} />
          </TouchableOpacity>
        )}

        {/* Side panel */}
        {panelOpen && (
          <>
            <TouchableWithoutFeedback onPress={closePanel}>
              <View className="absolute inset-0 bg-black/30" />
            </TouchableWithoutFeedback>

            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: PANEL_WIDTH,
                backgroundColor: isDark ? "#111827" : "#ffffff",
                transform: [{ translateX }],
                shadowColor: "#000",
                shadowOffset: { width: -4, height: 0 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 20,
                paddingTop: insets.top + 16,
              }}
            >
              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 32,
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* Logo + wordmark */}
                <View className="flex-row items-center mb-6 border-b border-gray-100 dark:border-gray-800 h-20">
                  <Image
                    source={require("../../../assets/images/Untitled-1ed copy.png")}
                    style={{ width: 30, height: 30, borderRadius: 6 }}
                    resizeMode="contain"
                  />
                  <Text className="text-3xl font-extrabold text-[#C0392B] ml-2 tracking-wide">
                    TOGETHERE
                  </Text>
                </View>

                {/* Avatar + name + rating */}
                <TouchableOpacity
                  className="flex-row items-center mb-5"
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress("/(tabs)/account")}
                >
                  <View className="relative mr-3">
                    <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
                      <UserCircle2 size={40} color={isDark ? "#6b7280" : "#9ca3af"} />
                    </View>
                    <TouchableOpacity
                      className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Camera size={16} color={isDark ? "#f3f4f6" : "#111827"} />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {user?.name ?? "…"}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      <View
                        className={`px-2 py-0.5 rounded-full mr-2 ${
                          isDriver ? "bg-[#FDEDEC] dark:bg-[#3a2422]" : "bg-gray-100 dark:bg-gray-800"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            isDriver ? "text-[#C0392B]" : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {isDriver ? "Driver" : "Commuter"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Menu items */}
                {MENU_ITEMS.map(({ label, Icon, route }, index) => (
                  <TouchableOpacity
                    key={label}
                    className={`flex-row items-center justify-between py-4 ${
                      index !== MENU_ITEMS.length - 1
                        ? "border-b border-gray-100 dark:border-gray-800"
                        : ""
                    }`}
                    activeOpacity={0.6}
                    onPress={() => handleMenuPress(route)}
                  >
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-[#FDEDEC] dark:bg-[#3a2422] items-center justify-center mr-3">
                        <Icon size={16} color="#C0392B" />
                      </View>
                      <Text className="text-base text-gray-900 dark:text-gray-100">{label}</Text>
                    </View>
                    <ChevronRight size={18} color={isDark ? "#6b7280" : "#9ca3af"} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </>
        )}
      </View>
    </ChromeContext.Provider>
  );
}