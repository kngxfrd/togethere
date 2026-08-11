import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import ChatScreen, { Chat, Message } from "@/components/ChatScreen";
import { useUserRole } from "@/hooks/useUserRole";
import { useRides } from "@/contexts/RideContext";
import { api } from "@/lib/api";

const POLL_INTERVAL_MS = 4000;

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useUserRole();
  const isDriver = role === "driver";
  const { requests } = useRides();

  const requestId = id?.startsWith("req-") ? id.slice(4) : id;
  const req = requests.find((r) => r.id === requestId && r.status === "accepted");

  const [messages, setMessages] = useState<Message[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!requestId) return;
    try {
      const data = await api.get(`/chats/${requestId}/messages/`);
      setMessages(data);
    } catch {
      // silent — keep showing whatever we already have rather than
      // flashing an error on a routine poll
    }
  }, [requestId]);

  // Fetch on focus, then poll lightly while the screen is open so
  // messages from the other party show up without a manual refresh.
  useFocusEffect(
    useCallback(() => {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [fetchMessages])
  );

  const handleSend = (text: string) => {
    if (!requestId) return;
    // Fire-and-forget: ChatScreen already added it locally for
    // immediate feedback. If this fails, the next poll will just show
    // the server's actual state (message won't be there), which is an
    // acceptable simplification for now.
    api.post(`/chats/${requestId}/messages/`, { text }).catch(() => {});
  };

  if (!req) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Chat not found.</Text>
      </SafeAreaView>
    );
  }

  const chat: Chat = {
    id: `req-${req.id}`,
    name: isDriver ? req.commuterName : `Driver — ${req.driverName}`,
    lastMessage: messages[messages.length - 1]?.text ?? `${req.destination} · ${req.date}`,
    time: messages[messages.length - 1]?.time ?? req.requestedAt,
    online: true,
  };

  return (
    <ChatScreen
      chat={chat}
      initialMessages={messages}
      onSend={handleSend}
      onBack={() => router.back()}
    />
  );
}