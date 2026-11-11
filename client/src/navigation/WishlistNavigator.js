import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WishlistScreen from "../screens/WishlistScreen";
import ListingDetailsScreen from "../screens/ListingDetailsScreen";
import SellerProfileScreen from "../screens/SellerProfileScreen";
import AccountNavigator from "./AccountNavigator";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

const WishlistNavigator = () => (
  <Stack.Navigator screenOptions={{ presentation: "modal" }}>
    <Stack.Screen
      name="WishlistRoot"
      component={WishlistScreen}
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

export default WishlistNavigator;
