import RideListItem from "@/components/ridelist";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = ["All","Short Distance", "Long Distance", "Sedan", "SUV"];

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

type Ride = {
  id: string;
  category: string;
  destination: string;
  driverName: string;
  vehicleInfo: string;
  passengerCount: number;
  driverPhoto?: string;
};

const RIDES: Ride[] = [
  {
    id: "1",
    category: "Short Distance",
    destination: "Asafo VIP Station",
    driverName: "Kwame Mensah",
    vehicleInfo: "Toyota Corolla",
    passengerCount: 4,
    driverPhoto: "https://example.com/avatar1.jpg",
  },
  {
    id: "2",
    category: "Short Distance",
    destination: "Kejetia Market",
    driverName: "Ama Owusu",
    vehicleInfo: "Hyundai Elantra",
    passengerCount: 3,
    driverPhoto: "https://example.com/avatar2.jpg",
  },
  {
    id: "3",
    category: "Long Distance",
    destination: "Adum, Kumasi",
    driverName: "Yaw Boateng",
    vehicleInfo: "Honda Wave",
    passengerCount: 1,
    driverPhoto: "https://example.com/avatar3.jpg",
  },
  {
    id: "4",
    category: "Sedan",
    destination: "KNUST Campus",
    driverName: "Efua Darko",
    vehicleInfo: "Kia Rio",
    passengerCount: 2,
    driverPhoto: "https://example.com/avatar4.jpg",
  },
];

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [message, setMessage] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const openRide = (ride: Ride) => {
    setSelectedRide(ride);
    setSheetOpen(true);
    translateY.setValue(SHEET_HEIGHT);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeRide = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSheetOpen(false);
      setSelectedRide(null);
      setMessage("");
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SHEET_HEIGHT * 0.25) {
          closeRide();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

 const filteredRides =
    activeCategory === "All"
      ? RIDES
      : RIDES.filter((r) => r.category === activeCategory);

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1 bg-white">
        <Text className="text-2xl font-bold text-gray-900 px-6 pt-7 mb-4">
          Explore
        </Text>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          className="mb-6 flex-grow-0"
        >
          {CATEGORIES.map((label) => {
            const isActive = label === activeCategory;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveCategory(label)}
                activeOpacity={0.7}
                className={`px-4 py-2 rounded-full ${
                  isActive ? "bg-black" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? "text-white" : "text-gray-700"
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Ride list */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        >
          {filteredRides.length === 0 && (
            <Text className="text-gray-400 text-center mt-10">
              No results in this category
            </Text>
          )}

          {filteredRides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              className="bg-gray-50 rounded-2xl px-2 py-1 mb-3"
              activeOpacity={0.7}
              onPress={() => openRide(ride)}
            >
              <RideListItem
                destination={ride.destination}
                driverName={ride.driverName}
                vehicleInfo={ride.vehicleInfo}
                passengerCount={ride.passengerCount}
                onPress={() => openRide(ride)}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Sheet overlay — no Modal, no separate transparent layer, just an absolutely
          positioned opaque View sitting on top of the screen */}
      {sheetOpen && (
        <>
          {/* Tap-outside-to-close area, sits behind the sheet, above the Explore screen.
              This has no background color at all (not even a transparent one applied
              via a Modal) — it's just an invisible touch target. */}
          <TouchableWithoutFeedback onPress={closeRide}>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: SHEET_HEIGHT,
              }}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: SHEET_HEIGHT,
              backgroundColor: "#ffffff",
              transform: [{ translateY }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 20,
            }}
            className="rounded-t-3xl"
          >
            {/* Drag handle */}
            <View
              {...panResponder.panHandlers}
              className="items-center pt-3 pb-2"
            >
              <View className="w-10 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {selectedRide && (
              <ScrollView
                contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Driver profile */}
                <View className="items-center mb-6">
                  <Image
                    source={{ uri: selectedRide.driverPhoto }}
                    className="w-24 h-24 rounded-full mb-3 bg-gray-200"
                  />
                  <Text className="text-xl font-bold text-gray-900">
                    {selectedRide.driverName}
                  </Text>
                  <Text className="text-gray-500">
                    {selectedRide.vehicleInfo}
                  </Text>
                </View>

                {/* Ride details */}
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <Text className="text-sm text-gray-500 mb-1">
                    Destination
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    {selectedRide.destination}
                  </Text>

                  <Text className="text-sm text-gray-500 mb-1">
                    Passengers
                  </Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {selectedRide.passengerCount}
                  </Text>
                </View>

                {/* Message box */}
                <Text className="text-sm text-gray-500 mb-2">
                  Message the driver
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  style={{ outlineStyle: "none" } as any}
                  placeholder="Type a message..."
                  multiline
                  className="bg-gray-100 rounded-2xl p-4 h-20 mb-6 text-base text-gray-900"
                  textAlignVertical="top"
                />

                {/* Send request button */}
                <TouchableOpacity
                  className="bg-black rounded-2xl py-4 items-center"
                  activeOpacity={0.8}
                  onPress={() => {
                    console.log("Send request", {
                      ride: selectedRide,
                      message,
                    });
                    closeRide();
                  }}
                >
                  <Text className="text-white font-semibold text-base">
                    Send Request
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}