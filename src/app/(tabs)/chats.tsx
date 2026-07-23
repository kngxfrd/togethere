import { Ionicons } from "@expo/vector-icons";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
};

const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    name: "Driver — Kwame",
    lastMessage: "I'm 2 mins away",
    time: "9:41 AM",
  },
];

export default function chats() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-gray-900 px-6 pt-6 mb-6">
        Chats
      </Text>
      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
              <Ionicons name="person" size={20} color="#374151" />
            </View>
            <View className="flex-1 mr-3">
              <Text className="text-base font-medium text-gray-900">
                {item.name}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                {item.lastMessage}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">{item.time}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-500 mt-8 text-center">
            No conversations yet.
          </Text>
        }
      />
    </SafeAreaView>
  );
}