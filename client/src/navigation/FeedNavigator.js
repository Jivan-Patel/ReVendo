import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListingDetailsScreen from "../screens/ListingDetailsScreen";
import ListingsScreen from "../screens/ListingsScreen";
import SellerProfileScreen from "../screens/SellerProfileScreen";
import OffersScreen from "../screens/OffersScreen";
import AccountNavigator from "./AccountNavigator";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

const FeedNavigator = () => (
  <Stack.Navigator screenOptions={{ presentation: "modal" }}>
    <Stack.Screen
      name="Listings"
      component={ListingsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
    <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
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

export default FeedNavigator;
