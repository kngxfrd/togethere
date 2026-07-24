import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatScreen, { Message } from "@/components/ChatScreen";
import { MOCK_CHATS } from "./index";

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", text: "On my way to pick you up", fromMe: false, time: "9:38 AM" },
    { id: "m2", text: "Great, I'm outside the gate", fromMe: true, time: "9:39 AM" },
    { id: "m3", text: "I'm 2 mins away", fromMe: false, time: "9:41 AM" },
  ],
};

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chat = MOCK_CHATS.find((c) => c.id === id);

  if (!chat) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Chat not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <ChatScreen
      chat={chat}
      initialMessages={MOCK_MESSAGES[chat.id] ?? []}
      onBack={() => router.back()}
    />
  );
}