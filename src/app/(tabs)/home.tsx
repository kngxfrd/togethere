import { Search } from "lucide-react-native";
import { useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;


const COLLAPSED_HEIGHT = 140; 
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85; 

export default function home() {
  const insets = useSafeAreaInsets();
  const translateY = useRef(
    new Animated.Value(EXPANDED_HEIGHT - COLLAPSED_HEIGHT),
  ).current;

  const lastOffset = useRef(EXPANDED_HEIGHT - COLLAPSED_HEIGHT);

  const springTo = (toValue: number) => {
    lastOffset.current = toValue;
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({

      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
      onPanResponderMove: (_, gesture) => {
        const next = lastOffset.current + gesture.dy;
        const clamped = Math.max(
          0,
          Math.min(EXPANDED_HEIGHT - COLLAPSED_HEIGHT, next),
        );
        translateY.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        const current = lastOffset.current + gesture.dy;
        const midpoint = (EXPANDED_HEIGHT - COLLAPSED_HEIGHT) / 2;

        if (gesture.vy > 0.5) {
          springTo(EXPANDED_HEIGHT - COLLAPSED_HEIGHT); 
        } else if (gesture.vy < -0.5) {
          springTo(0); 
        } else if (current > midpoint) {
          springTo(EXPANDED_HEIGHT - COLLAPSED_HEIGHT);
        } else {
          springTo(0);
        }
      },
    }),
  ).current;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-xl font-semibold text-gray-900">
          Map goes here
        </Text>
      </View>

      <View
        style={{ top: insets.top + 12 }}
        className="absolute left-5 right-5 mt-2 right-20"
      >
        <View
          className="flex-row items-center bg-gray-100 rounded-2xl px-5 py-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Search size={18} color="#6b7280" />
          <TextInput
            placeholder="Where are you going"
            placeholderTextColor="#9ca3af"
            style={{ outlineStyle: "none" } as any}
            className="flex-1 ml-2 text-base text-gray-900"
          />
        </View>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: EXPANDED_HEIGHT,
          transform: [{ translateY }],
        }}
        className="bg-white rounded-t-3xl"
        {...panResponder.panHandlers}
      >
        <View
          className="absolute inset-0 rounded-t-3xl bg-white"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 10,
          }}
        />

        <View className="items-center py-3">
          <View className="w-10 h-1.5 rounded-full bg-gray-300" />
        </View>

        <View className="px-5">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Recent Searches
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
