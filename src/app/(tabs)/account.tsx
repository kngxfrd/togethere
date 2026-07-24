import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera, Pencil, Check, X } from "lucide-react-native";
import { useAuth } from "../../hooks/useAuth";

export default function Account() {
  const { user, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPhone(user?.phone ?? "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: replace with your real update call, e.g.
      // await updateUser({ name, email, phone });
      console.log("Saving account details", { name, email, phone });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("../(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-6 pb-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Account</Text>
        </View>

        {!isEditing && (
          <TouchableOpacity
            onPress={startEditing}
            className="flex-row items-center bg-gray-50 rounded-full px-4 py-2"
            activeOpacity={0.7}
          >
            <Pencil size={14} color="#111827" />
            <Text className="text-sm font-medium text-gray-900 ml-1.5">
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 48,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View className="items-center mb-10">
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="person" size={40} color="#374151" />
              </View>
              {isEditing && (
                <TouchableOpacity
                  className="absolute -right-1 -bottom-1 w-9 h-9 rounded-full bg-black items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Camera size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            {!isEditing && (
              <>
                <Text className="text-xl font-bold text-gray-900 mt-4">
                  {user?.name ?? "Guest"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {user?.email}
                </Text>
              </>
            )}
          </View>

          {/* Editable fields */}
          <View className="mb-8">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Full name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              editable={isEditing}
              placeholder="Your name"
              className={`text-base rounded-2xl px-4 py-3.5 mb-6 ${
                isEditing
                  ? "bg-gray-50 text-gray-900"
                  : "bg-white text-gray-500"
              }`}
              style={
                !isEditing
                  ? { borderWidth: 1, borderColor: "#f3f4f6" }
                  : undefined
              }
            />

            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className={`text-base rounded-2xl px-4 py-3.5 mb-6 ${
                isEditing
                  ? "bg-gray-50 text-gray-900"
                  : "bg-white text-gray-500"
              }`}
              style={
                !isEditing
                  ? { borderWidth: 1, borderColor: "#f3f4f6" }
                  : undefined
              }
            />

            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              placeholder="+233 XX XXX XXXX"
              keyboardType="phone-pad"
              className={`text-base rounded-2xl px-4 py-3.5 ${
                isEditing
                  ? "bg-gray-50 text-gray-900"
                  : "bg-white text-gray-500"
              }`}
              style={
                !isEditing
                  ? { borderWidth: 1, borderColor: "#f3f4f6" }
                  : undefined
              }
            />
          </View>

          {/* Save / Cancel while editing */}
          {isEditing && (
            <View className="flex-row mb-8" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={cancelEditing}
                disabled={saving}
                className="flex-1 flex-row items-center justify-center bg-gray-50 rounded-2xl py-4"
                activeOpacity={0.7}
              >
                <X size={18} color="#374151" />
                <Text className="text-gray-900 font-semibold ml-2">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 flex-row items-center justify-center bg-black rounded-2xl py-4"
                activeOpacity={0.8}
              >
                <Check size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">
                  {saving ? "Saving..." : "Save changes"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign out */}
          {!isEditing && (
            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-red-50 rounded-2xl py-4 items-center mt-4"
              activeOpacity={0.7}
            >
              <Text className="text-red-600 font-semibold">Sign out</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}