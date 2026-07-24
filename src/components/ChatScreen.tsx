import { ArrowLeft, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChrome } from "@/app/(tabs)/_layout";

export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  online: boolean;
};

export type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
};

type ChatScreenProps = {
  chat: Chat;
  initialMessages?: Message[];
  onBack: () => void;
};

export default function ChatScreen({
  chat,
  initialMessages = [],
  onBack,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const { setHideChrome } = useChrome();

  // Hide the tab bar + hamburger button while this chat is open,
  // restore them when leaving.
  useEffect(() => {
    setHideChrome(true);
    return () => setHideChrome(false);
  }, []);

  const sendMessage = () => {
    if (!draft.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: draft.trim(),
      fromMe: true,
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-5 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={onBack} className="mr-3 p-1">
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>

        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
          <Ionicons name="person" size={18} color="#374151" />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {chat.name}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                chat.online ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <Text className="text-xs text-gray-500">
              {chat.online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          renderItem={({ item }) => (
            <View
              className={`mb-3 max-w-[75%] ${
                item.fromMe ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <View
                className={`rounded-2xl px-4 py-2.5 ${
                  item.fromMe ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-base ${
                    item.fromMe ? "text-white" : "text-gray-900"
                  }`}
                >
                  {item.text}
                </Text>
              </View>
              <Text className="text-xs text-gray-400 mt-1">{item.time}</Text>
            </View>
          )}
        />

        {/* Input bar */}
        <View className="flex-row items-center px-4 pt-6 border-t border-gray-100">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={{ outlineStyle: "none" } as any}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-base text-gray-900 mr-3"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!draft.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              draft.trim() ? "bg-black" : "bg-gray-200"
            }`}
            activeOpacity={0.7}
          >
            <Send
              size={18}
              color={draft.trim() ? "#fff" : "#9ca3af"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}