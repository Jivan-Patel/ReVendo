import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyListingsScreen from "../screens/MyListingsScreen";
import ListingDetailsScreen from "../screens/ListingDetailsScreen";
import SellerProfileScreen from "../screens/SellerProfileScreen";
import AccountNavigator from "./AccountNavigator";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

const MyListingsNavigator = () => (
  <Stack.Navigator screenOptions={{ presentation: "modal" }}>
    <Stack.Screen
      name="MyListingsRoot"
      component={MyListingsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
    <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Account"
      component={AccountNavigator}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export default MyListingsNavigator;
