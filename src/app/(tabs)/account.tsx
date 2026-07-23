import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";

export default function account() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("../(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <View className="items-center mt-10 mb-10">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <Ionicons name="person" size={36} color="#374151" />
        </View>
        <Text className="text-xl font-bold text-gray-900">
          {user?.name ?? "Guest"}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{user?.email}</Text>
      </View>

      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-red-50 rounded-xl py-4 items-center"
      >
        <Text className="text-red-600 font-semibold">Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}