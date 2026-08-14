import { useCallback, useMemo, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { CheckCircle2, Clock3, MapPin, XCircle } from "lucide-react-native";
import { useRides, PostedRide } from "@/contexts/RideContext";
import { useTheme } from "@/hooks/useTheme";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

type SortOption = "newest" | "priceLowHigh" | "seatsAvailable";



type StatusFilter = "all" | "pending" | "accepted" | "declined";

const STATUS_FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
];

// Fare strings look like "$12.50" — strip anything that isn't a digit or
// decimal point so they sort numerically rather than lexicographically.
const parseFare = (fare: string) => parseFloat(fare.replace(/[^0-9.]/g, "")) || 0;

// Small colored icon badge that replaces the old "Accepted / Declined /
// Request sent" text in the ride cards.
function StatusBadge({ status }: { status: "accepted" | "pending" | "declined" }) {
  const config = {
    accepted: { Icon: CheckCircle2, bg: "bg-green-100 dark:bg-green-900", color: "#15803d" },
    pending: { Icon: Clock3, bg: "bg-yellow-100 dark:bg-yellow-900", color: "#a16207" },
    declined: { Icon: XCircle, bg: "bg-red-100 dark:bg-red-900", color: "#b91c1c" },
  }[status];

  const { Icon, bg, color } = config;

  return (
    <View className={`w-7 h-7 rounded-full items-center justify-center ${bg}`}>
      <Icon size={15} color={color} />
    </View>
  );
}

export default function Explore() {
  const { postedRides, requests, requestRide, refresh } = useRides();
  const { isDark } = useTheme();
  const [selectedRide, setSelectedRide] = useState<PostedRide | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [statusFilterBy, setStatusFilterBy] = useState<StatusFilter>("all");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const translateY = useState(new Animated.Value(SHEET_HEIGHT))[0];

  const openRide = (ride: PostedRide) => {
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
    });
  };

  const panResponder = useState(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SHEET_HEIGHT * 0.25) {
          closeRide();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    })
  )[0];

  const statusFor = (ride: PostedRide) =>
    requests.find((r) => r.rideId === ride.id)?.status;

  const handleSendRequest = async () => {
    if (!selectedRide) return;
    setRequesting(true);
    try {
      await requestRide(selectedRide);
      closeRide();
    } catch (err: any) {
      console.error("Failed to send request:", err.message);
    } finally {
      setRequesting(false);
    }
  };

  const selectedStatus = selectedRide ? statusFor(selectedRide) : undefined;

  // "Newest" relies on postedRides already coming back newest-first from
  // the API (no createdAt field on PostedRide to sort by client-side), so
  // that option is a no-op copy; the other two sort explicitly.
  const sortedRides = useMemo(() => {
    const rides = [...postedRides];
    switch (sortBy) {
      case "priceLowHigh":
        return rides.sort((a, b) => parseFare(a.fare) - parseFare(b.fare));
      case "seatsAvailable":
        return rides.sort(
          (a, b) =>
            (b.seatsTotal - b.seatsFilled) - (a.seatsTotal - a.seatsFilled)
        );
      case "newest":
      default:
        return rides;
    }
  }, [postedRides, sortBy]);

  // Applies the status filter on top of the already-sorted list, so sort
  // order is preserved within the filtered results. "All" keeps every
  // ride regardless of whether it has a request on it at all.
  const visibleRides = useMemo(() => {
    if (statusFilterBy === "all") return sortedRides;
    return sortedRides.filter((ride) => statusFor(ride) === statusFilterBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedRides, statusFilterBy, requests]);

  return (
    <View className="flex-1">
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 px-6 pt-7 mb-4">
          Explore
        </Text>


          

        <View className="flex-row px-6 mb-4" style={{ gap: 8 }}>
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const active = statusFilterBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setStatusFilterBy(opt.key)}
                activeOpacity={0.75}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? "bg-[#C0392B] border-[#C0392B]"
                    : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    active ? "text-white" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {visibleRides.length === 0 && (
            <Text className="text-gray-400 dark:text-gray-500 text-center mt-10">
              {statusFilterBy === "all"
                ? "No rides posted yet — check back soon."
                : `No ${statusFilterBy} rides.`}
            </Text>
          )}

          {visibleRides.map((ride) => {
            const status = statusFor(ride);
            const full = ride.seatsFilled >= ride.seatsTotal;
            return (
              <TouchableOpacity
                key={ride.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-4 mb-3 flex-row items-center"
                activeOpacity={0.7}
                onPress={() => openRide(ride)}
              >
                <Image
                  source={require("../../pics/Sedan-160-temp.png")}
                  style={{ width: 56, height: 56, marginRight: 12 }}
                  resizeMode="contain"
                />

                <View className="flex-1">
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#C0392B" style={{ marginRight: 4 }} />
                    <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {ride.destination}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {ride.driverName} · {ride.date}
                  </Text>

                  <View className="flex-row justify-between items-start mt-2">
                    <View>
                      <Text className="text-sm text-gray-700 dark:text-gray-300">{ride.fare}</Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {ride.seatsFilled}/{ride.seatsTotal} seats
                        {full ? " · Full" : ""}
                      </Text>
                    </View>

                    {status && <StatusBadge status={status} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {sheetOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeRide}>
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: SHEET_HEIGHT }} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: SHEET_HEIGHT,
              backgroundColor: isDark ? "#111827" : "#ffffff",
              transform: [{ translateY }],
              shadowColor: isDark ? "#ffffff":"#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: isDark? 0.06 : 0.15,
              shadowRadius: 16,
              elevation: 20,
            }}
            className="rounded-t-3xl "
          >
            <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
              <View className="w-10 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </View>

            {selectedRide && (
              <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View className="items-center mb-4">
                  <Image
                    source={require("../../pics/Sedan-160-temp.png")}
                    style={{ width: 140, height: 140 }}
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedRide.driverName}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 mb-6">Driver</Text>

                <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6">
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Destination</Text>
                  <View className="flex-row items-center mb-3">
                    <MapPin size={16} color="#C0392B" style={{ marginRight: 4 }} />
                    <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {selectedRide.destination}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {selectedRide.date}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Fare</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {selectedRide.fare}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Seats</Text>
                  <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {selectedRide.seatsFilled}/{selectedRide.seatsTotal} filled
                  </Text>
                </View>

                {selectedStatus === "accepted" ? (
                  <View className="bg-green-100 dark:bg-green-900 rounded-2xl py-4 items-center">
                    <Text className="text-green-700 dark:text-green-300 font-semibold">Request Accepted!</Text>
                  </View>
                ) : selectedStatus === "pending" ? (
                  <View className="bg-yellow-100 dark:bg-yellow-900 rounded-2xl py-4 items-center">
                    <Text className="text-yellow-700 dark:text-yellow-300 font-semibold">Request sent</Text>
                  </View>
                ) : selectedStatus === "declined" ? (
                  <View className="bg-red-100 dark:bg-red-900 rounded-2xl py-4 items-center">
                    <Text className="text-red-700 dark:text-red-300 font-semibold">Declined</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    className={`rounded-2xl py-4 items-center ${
                      selectedRide.seatsFilled >= selectedRide.seatsTotal || requesting
                        ? "bg-gray-300 dark:bg-gray-800"
                        : "bg-[#C0392B]"
                    }`}
                    activeOpacity={0.8}
                    disabled={selectedRide.seatsFilled >= selectedRide.seatsTotal || requesting}
                    onPress={handleSendRequest}
                  >
                    <Text className="text-white font-semibold text-base">
                      {requesting
                        ? "Sending…"
                        : selectedRide.seatsFilled >= selectedRide.seatsTotal
                        ? "Full"
                        : "Send Request"}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}