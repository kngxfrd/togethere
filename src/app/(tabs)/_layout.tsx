import { Tabs, router, usePathname } from "expo-router";
import { createContext, useContext, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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
  { label: "Payment", Icon: CreditCard, route: null },
  { label: "Support", Icon: HelpCircle, route: null },
  { label: "Safety", Icon: ShieldCheck, route: null },
  { label: "Saved places", Icon: MapPin, route: null },
  { label: "Settings", Icon: SettingsIcon, route: "/(tabs)/settings" },
] as const;

// TODO: replace with your real auth/user source (context, hook, store, etc.)
// This is just a placeholder so the panel has something to render.
function getCurrentUser() {
  return {
    name: "User",
    rating: null as number | null,
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isAccountScreen = pathname.includes("/account");
  const isSettingsScreen = pathname.includes("/settings");
  const user = getCurrentUser();
  const role = useUserRole();
  const isDriver = role === "driver";

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
            tabBarActiveTintColor: "#111827",
            tabBarInactiveTintColor: "#9CA3AF",
            tabBarStyle: hideChrome
              ? { display: "none" }
              : {
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
            className="absolute right-5 w-12 h-12 mt-1 rounded-full bg-gray-50 items-center justify-center"
            activeOpacity={0.7}
          >
            <Menu size={24} color="#111827" />
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
                backgroundColor: "#ffffff",
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
                {/* Avatar + name + rating */}
                <TouchableOpacity
                  className="items-start mb-5"
                  activeOpacity={0.7}
                  onPress={() => handleMenuPress("/(tabs)/account")}
                >
                  <View className="relative mb-3">
                    <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center">
                      <UserCircle2 size={40} color="#9ca3af" />
                    </View>
                    <TouchableOpacity
                      className="absolute -right-1 -bottom-1 w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      activeOpacity={0.7}
                    >
                      <Camera size={16} color="#111827" />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-xl font-bold text-gray-900">
                    {user.name}
                  </Text>
                  {user.rating !== null && (
                    <View className="flex-row items-center mt-1">
                      <Star size={14} color="#111827" fill="#111827" />
                      <Text className="text-sm text-gray-700 ml-1">
                        {user.rating.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Menu items */}
                {MENU_ITEMS.map(({ label, Icon, route }, index) => (
                  <TouchableOpacity
                    key={label}
                    className={`flex-row items-center justify-between py-4 ${
                      index !== MENU_ITEMS.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                    activeOpacity={0.6}
                    onPress={() => handleMenuPress(route)}
                  >
                    <View className="flex-row items-center">
                      <Icon size={20} color="#374151" />
                      <Text className="text-base text-gray-900 ml-3">
                        {label}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#9ca3af" />
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