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
  // Optional: called with the raw text right after it's added to the
  // local message list, so the screen embedding ChatScreen can persist
  // it (e.g. POST to the backend). If omitted, ChatScreen behaves
  // exactly as before — local-only.
  onSend?: (text: string) => void;
};

export default function ChatScreen({
  chat,
  initialMessages = [],
  onBack,
  onSend,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const { setHideChrome } = useChrome();

  // Keep the local list in sync if the parent screen refetches messages
  // (e.g. polling) and passes a new initialMessages array down.
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setHideChrome(true);
    return () => setHideChrome(false);
  }, []);

  const sendMessage = () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      fromMe: true,
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
    onSend?.(text);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
                  item.fromMe ? "bg-[#C0392B]" : "bg-gray-100"
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
              draft.trim() ? "bg-[#C0392B]" : "bg-red-300"
            }`}
            activeOpacity={0.7}
          >
            <Send
              size={18}
              color={draft.trim() ? "#fff" : "#fff"}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}