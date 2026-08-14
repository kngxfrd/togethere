import { Link, router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)/home");
    } catch (err) {
      setError("Couldn't log in. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 justify-center px-8">
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

        <View className="mb-5">
          <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Welcome back
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400">
            Log in to continue your journey.
          </Text>
        </View>

        <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-5 mb-3 bg-gray-100 dark:bg-gray-900">
          <Mail size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{ outlineStyle: "none" } as any}
            keyboardType="email-address"
            className="flex-1 ml-3 py-3 text-base text-gray-900 dark:text-gray-100"
          />
        </View>

        <View className="flex-row items-center border border-gray-300 dark:border-gray-700 rounded-xl px-5 mb-6 bg-gray-100 dark:bg-gray-900">
          <Lock size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            style={{ outlineStyle: "none" } as any}
            onChangeText={setPassword}
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
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
          className={`rounded-xl py-4 items-center ${
            loading ? "bg-red-300 dark:bg-red-900" : "bg-[#C0392B]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Log in</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text className="text-[#C0392B] font-semibold">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}