import RideListItem from "@/components/ridelist";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  "Rides",
  "Food delivery",
  "Package delivery",
  "Scheduled rides",
];

export default function explore() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-2xl font-bold text-gray-900 px-6 pt-7 mb-10">
        Explore
      </Text>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      >
        {CATEGORIES.map((label) => (
          <TouchableOpacity
            key={label}
            className="bg-gray-50 rounded-2xl px-2 py-1"
            activeOpacity={0.7}
          >
            <RideListItem
              destination="Asafo VIP Station"
              driverName="Kwame Mensah"
              vehicleInfo="Toyota Corolla"
              passengerCount={4}
              onPress={() => console.log("open ride details")}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
