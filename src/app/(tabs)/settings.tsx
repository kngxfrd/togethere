import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Lock,
  Eye,
  MapPin,
  ShieldCheck,
  FileText,
  HelpCircle,
  MessageCircle,
  Star,
  LogOut,
  ChevronRight,
} from "lucide-react-native";

type ToggleRowProps = {
  Icon: typeof Bell;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({
  Icon,
  label,
  description,
  value,
  onValueChange,
}: ToggleRowProps) {
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-9 h-9 rounded-full bg-gray-50 items-center justify-center mr-3">
          <Icon size={18} color="#374151" />
        </View>
        <View className="flex-1">
          <Text className="text-base text-gray-900">{label}</Text>
          {description && (
            <Text className="text-xs text-gray-500 mt-0.5">
              {description}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#e5e7eb", true: "#111827" }}
        thumbColor="#ffffff"
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );
}

type NavRowProps = {
  Icon: typeof Bell;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  isLast?: boolean;
};

function NavRow({ Icon, label, onPress, destructive, isLast }: NavRowProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between py-4 ${
        isLast ? "" : "border-b border-gray-100"
      }`}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View
          className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
            destructive ? "bg-red-50" : "bg-gray-50"
          }`}
        >
          <Icon size={18} color={destructive ? "#dc2626" : "#374151"} />
        </View>
        <Text
          className={`text-base ${
            destructive ? "text-red-600" : "text-gray-900"
          }`}
        >
          {label}
        </Text>
      </View>
      {!destructive && <ChevronRight size={18} color="#9ca3af" />}
    </TouchableOpacity>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-8 px-1">
      {children}
    </Text>
  );
}

export default function Settings() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [rideUpdates, setRideUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-6 pb-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <ToggleRow
          Icon={Moon}
          label="Dark mode"
          value={darkMode}
          onValueChange={setDarkMode}
        />
        <TouchableOpacity
          className="flex-row items-center justify-between py-4"
          activeOpacity={0.6}
          onPress={() => {}}
        >
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-gray-50 items-center justify-center mr-3">
              <Globe size={18} color="#374151" />
            </View>
            <Text className="text-base text-gray-900">Language</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-400 mr-1">English</Text>
            <ChevronRight size={18} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Notifications */}
        <SectionLabel>Notifications</SectionLabel>
        <ToggleRow
          Icon={Bell}
          label="Push notifications"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
        <ToggleRow
          Icon={MessageCircle}
          label="Ride updates"
          description="Driver arrival, trip status, and receipts"
          value={rideUpdates}
          onValueChange={setRideUpdates}
        />
        <ToggleRow
          Icon={Star}
          label="Promotions & offers"
          value={promotions}
          onValueChange={setPromotions}
        />

        {/* Privacy & Safety */}
        <SectionLabel>Privacy & Safety</SectionLabel>
        <ToggleRow
          Icon={MapPin}
          label="Share location"
          description="Used to match you with nearby drivers"
          value={shareLocation}
          onValueChange={setShareLocation}
        />
        <ToggleRow
          Icon={Eye}
          label="Show profile to drivers"
          value={profileVisible}
          onValueChange={setProfileVisible}
        />
        <NavRow
          Icon={ShieldCheck}
          label="Safety toolkit"
          onPress={() => {}}
        />
        <NavRow
          Icon={Lock}
          label="Privacy policy"
          onPress={() => {}}
          isLast
        />

        {/* Support */}
        <SectionLabel>Support</SectionLabel>
        <NavRow Icon={HelpCircle} label="Help center" onPress={() => {}} />
        <NavRow
          Icon={FileText}
          label="Terms of service"
          onPress={() => {}}
          isLast
        />

        {/* Sign out */}
        <SectionLabel>Account</SectionLabel>
        <NavRow
          Icon={LogOut}
          label="Sign out"
          destructive
          isLast
          onPress={() => {
            // TODO: hook up to your real sign-out logic
            // e.g. clear auth token/session, then redirect to login
          }}
        />

        <Text className="text-xs text-gray-300 text-center mt-10">
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}