import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat } from "@/components/ChatScreen";
import { useUserRole } from "@/hooks/useUserRole";
import { useRides } from "@/contexts/RideContext";

const CURRENT_DRIVER_NAME = "Kwame";
const CURRENT_COMMUTER_NAME = "You";

export const MOCK_CHATS: Chat[] = [
  {
    id: "1",
    name: "Driver — Kwame",
    lastMessage: "I'm 2 mins away",
    time: "9:41 AM",
    online: true,
  },
];

export default function ChatsList() {
  const role = useUserRole();
  const isDriver = role === "driver";
  const { requests, acceptRequest, declineRequest } = useRides();

  if (isDriver) {
    const pending = requests.filter(
      (r) => r.driverName === CURRENT_DRIVER_NAME && r.status === "pending"
    );
    const acceptedChats: Chat[] = requests
      .filter((r) => r.driverName === CURRENT_DRIVER_NAME && r.status === "accepted")
      .map((r) => ({
        id: r.id,
        name: `Commuter — ${r.commuterName}`,
        lastMessage: `Ride confirmed — ${r.destination}`,
        time: r.requestedAt,
        online: true,
      }));

    return (
      <SafeAreaView className="flex-1 bg-white">
        <Text className="text-2xl font-bold text-gray-900 px-6 pt-6 mb-6">
          Chats
        </Text>

        {pending.length > 0 && (
          <View className="px-6 mb-2">
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Ride requests
            </Text>
            {pending.map((req) => (
              <View key={req.id} className="py-4 border-b border-gray-100">
                <Text className="text-base font-medium text-gray-900">
                  {req.commuterName} wants a seat
                </Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  {req.destination} · {req.date} · {req.fare}
                </Text>
                <View className="flex-row mt-3">
                  <TouchableOpacity
                    onPress={() => declineRequest(req.id)}
                    className="flex-1 mr-2 rounded-xl py-2.5 items-center bg-gray-100"
                    activeOpacity={0.8}
                  >
                    <Text className="text-gray-700 font-semibold text-sm">Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => acceptRequest(req.id)}
                    className="flex-1 ml-2 rounded-xl py-2.5 items-center bg-black"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-semibold text-sm">Accept</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <FlatList
          data={acceptedChats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => router.push({ pathname: "/(tabs)/chats/[id]", params: { id: item.id } })}
            >
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
                <Ionicons name="person" size={20} color="#374151" />
              </View>
              <View className="flex-1 mr-3">
                <Text className="text-base font-medium text-gray-900">{item.name}</Text>
                <Text className="text-sm text-gray-500 mt-0.5">{item.lastMessage}</Text>
              </View>
              <Text className="text-xs text-gray-400">{item.time}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            pending.length === 0 ? (
              <Text className="text-gray-500 mt-8 text-center">
                No conversations yet.
              </Text>
            ) : null
          }
        />
      </SafeAreaView>
    );
  }

  // Commuter view
  const myPending = requests.filter(
    (r) => r.commuterName === CURRENT_COMMUTER_NAME && r.status === "pending"
  );
  const myAcceptedChats: Chat[] = requests
    .filter((r) => r.commuterName === CURRENT_COMMUTER_NAME && r.status === "accepted")
    .map((r) => ({
      id: r.id,
      name: `Driver — ${r.driverName}`,
      lastMessage: `Ride confirmed — ${r.destination}`,
      time: r.requestedAt,
      online: true,
    }));

  const chats = [...myAcceptedChats, ...MOCK_CHATS];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-gray-900 px-6 pt-6 mb-6">
        Chats
      </Text>

      {myPending.length > 0 && (
        <View className="px-6 mb-2">
          <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Waiting for driver
          </Text>
          {myPending.map((req) => (
            <View key={req.id} className="py-4 border-b border-gray-100">
              <Text className="text-base font-medium text-gray-900">
                {req.destination}
              </Text>
              <Text className="text-sm text-amber-600 mt-0.5">
                Request sent — waiting for {req.driverName} to respond
              </Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center py-4 border-b border-gray-100"
            onPress={() => router.push({ pathname: "/(tabs)/chats/[id]", params: { id: item.id } })}
          >
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
              <Ionicons name="person" size={20} color="#374151" />
            </View>
            <View className="flex-1 mr-3">
              <Text className="text-base font-medium text-gray-900">{item.name}</Text>
              <Text className="text-sm text-gray-500 mt-0.5">{item.lastMessage}</Text>
            </View>
            <Text className="text-xs text-gray-400">{item.time}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          myPending.length === 0 ? (
            <Text className="text-gray-500 mt-8 text-center">No conversations yet.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}