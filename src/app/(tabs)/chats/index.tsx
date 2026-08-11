import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chat } from "@/components/ChatScreen";
import { useUserRole } from "@/hooks/useUserRole";
import { useRides, RideRequest } from "@/contexts/RideContext";
import { api } from "@/lib/api";

export default function ChatsList() {
  const role = useUserRole();
  const isDriver = role === "driver";
  const { acceptRequest, declineRequest } = useRides();

  const [chats, setChats] = useState<Chat[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    if (!isDriver) return;
    try {
      const data = await api.get("/requests/pending/");
      setPendingRequests(data.map((r: any) => ({ ...r, id: String(r.id), rideId: String(r.rideId) })));
    } catch {
      // leave whatever was already shown
    }
  }, [isDriver]);

  const loadChats = useCallback(async () => {
  try {
    const data = await api.get("/chats/");
    console.log("CHATS RESPONSE:", data);
    setChats(data);
  } catch (err) {
    console.log("CHATS FAILED:", err);
  }
}, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
      loadPending();
    }, [loadChats, loadPending])
  );

  const handleAccept = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      await acceptRequest(requestId);
      await Promise.all([loadPending(), loadChats()]);
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setRespondingId(requestId);
    try {
      await declineRequest(requestId);
      await loadPending();
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-gray-900 px-6 pt-6 mb-6">
        Chats
      </Text>

      {isDriver && pendingRequests.length > 0 && (
        <View className="px-6 mb-4">
          <Text className="text-sm font-semibold text-gray-500 mb-3">
            Ride requests
          </Text>
          {pendingRequests.map((req) => (
            <View
              key={req.id}
              className="border border-gray-100 rounded-2xl p-4 mb-3"
            >
              <Text className="text-base font-medium text-gray-900">
                {req.commuterName}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5">
                {req.destination} · {req.date} · {req.fare}
              </Text>
              <View className="flex-row mt-3" style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleAccept(req.id)}
                  disabled={respondingId === req.id}
                  activeOpacity={0.8}
                  className="flex-1 bg-black rounded-xl py-2.5 items-center"
                >
                  <Text className="text-white font-semibold text-sm">
                    {respondingId === req.id ? "…" : "Accept"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDecline(req.id)}
                  disabled={respondingId === req.id}
                  activeOpacity={0.8}
                  className="flex-1 bg-gray-100 rounded-xl py-2.5 items-center"
                >
                  <Text className="text-gray-700 font-semibold text-sm">
                    Decline
                  </Text>
                </TouchableOpacity>
              </View>
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
            onPress={() =>
              router.push({
                pathname: "/(tabs)/chats/[id]",
                params: { id: item.id },
              })
            }
          >
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