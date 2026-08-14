import { Link, router } from "expo-router";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  Car,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

type Role = "commuter" | "driver";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+233");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("commuter");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!fullName || !email || !phone || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signUp({
        fullName,
        email,
        phone: `${countryCode}${phone}`,
        password,
        role,
      });
      router.replace("/(tabs)/home");
    } catch (err) {
      setError("Couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        className="px-8"
      >
        <View className="flex-row items-center mb-3">
          <Image
            source={require("../../../assets/images/Untitled-1ed copy.png")}
            style={{ width: 32, height: 32, borderRadius: 8 }}
            resizeMode="contain"
          />
          <Text className="text-4xl font-extrabold text-[#C0392B] ml-2 tracking-wide">
            TOGETHERE
          </Text>
        </View>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create account
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400">
            Sign up to get started.
          </Text>
        </View>

        <View className="flex-row mb-5" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => setRole("commuter")}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center rounded-xl py-3 border ${
              role === "commuter"
                ? "bg-[#C0392B] border-[#C0392B]"
                : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Users
              size={18}
              color={role === "commuter" ? "#ffffff" : "#9CA3AF"}
            />
            <Text
              className={`ml-2 font-semibold ${
                role === "commuter"
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Commuter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole("driver")}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center rounded-xl py-3 border ${
              role === "driver"
                ? "bg-[#C0392B] border-[#C0392B]"
                : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            }`}
          >
            <Car size={18} color={role === "driver" ? "#ffffff" : "#9CA3AF"} />
            <Text
              className={`ml-2 font-semibold ${
                role === "driver"
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Driver
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-5 mb-3 bg-gray-100 dark:bg-gray-900">
          <User size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            style={{ outlineStyle: "none" } as any}
            className="flex-1 ml-3 py-3 text-base text-gray-900 dark:text-gray-100"
          />
        </View>

        <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-5 mb-3 bg-gray-100 dark:bg-gray-900">
          <Mail size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ outlineStyle: "none" } as any}
            className="flex-1 ml-3 py-3 text-base text-gray-900 dark:text-gray-100"
          />
        </View>

        <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl mb-3 bg-gray-100 dark:bg-gray-900 px-5">
          <Phone size={20} color="#9CA3AF" />
          <TextInput
            value={countryCode}
            onChangeText={setCountryCode}
            keyboardType="phone-pad"
            style={{ outlineStyle: "none", width: 48 } as any}
            className="ml-3 py-3 text-base text-gray-900 dark:text-gray-100 font-medium"
          />
          <View className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />
          <TextInput
            placeholder="Phone number"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ outlineStyle: "none" } as any}
            className="flex-1 py-3 text-base text-gray-900 dark:text-gray-100"
          />
        </View>

        <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-5 mb-6 bg-gray-100 dark:bg-gray-900">
          <Lock size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            style={{ outlineStyle: "none" } as any}
            className="flex-1 ml-3 py-3 text-base text-gray-900 dark:text-gray-100"
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            {showPassword ? (
              <EyeOff size={20} color="#9CA3AF" />
            ) : (
              <Eye size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View className="mb-4">
            <Text className="text-red-600 dark:text-red-400 text-xs">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
          className={`rounded-xl py-4 items-center ${
            loading ? "bg-red-300 dark:bg-red-900" : "bg-[#C0392B]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Create account
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6 mb-10">
          <Text className="text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-[#C0392B] font-semibold">Log in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}