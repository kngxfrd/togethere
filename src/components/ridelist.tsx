import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Users, Info } from "lucide-react-native";

type RideListItemProps = {
  destination: string;
  driverName: string;
  vehicleInfo?: string;
  passengerCount: number;
  onPress?: () => void;
};

export default function RideListItem({
  destination,
  driverName,
  vehicleInfo,
  passengerCount,
  onPress,
}: RideListItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center rounded-2xl px-4 py-3 mb-3 bg-gray-100"
      style={{ minHeight: 100, width: "100%" }}
    >

      <Image
        source={require("../pics/Sedan-160-temp.png")}
        style={{ width: 54, height: 54, resizeMode: "contain" }}
      />

      <View className="flex-1 ml-3 mr-2">
        <Text
          className="text-base font-semibold text-gray-900"
          numberOfLines={1}
        >
          {destination}
        </Text>
        <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
          {driverName}
          {vehicleInfo ? ` · ${vehicleInfo}` : ""}
        </Text>
      </View>

      <View className="flex-row items-center">

        <View className="flex-row items-center">
          <Users size={16} color="#374151" />
          <Text className="text-gray-900 text-sm font-medium ml-1">
            {passengerCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}