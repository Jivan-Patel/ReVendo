import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MessagesScreen from "../screens/MessagesScreen";
import AccountScreen from "../screens/AccountScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import ListingDetailsScreen from "../screens/ListingDetailsScreen";
import WishlistScreen from "../screens/WishlistScreen";
import SellerProfileScreen from "../screens/SellerProfileScreen";
import OffersScreen from "../screens/OffersScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

const AccountNavigator = () => (
  <Stack.Navigator screenOptions={{ presentation: "modal" }}>
    <Stack.Screen name="MyAccount" component={AccountScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
    <Stack.Screen name="Messages" component={MessagesScreen} />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen name="MyListings" component={MyListingsScreen} />
    <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
    <Stack.Screen name="Wishlist" component={WishlistScreen} />
    <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
    <Stack.Screen name="Offers" component={OffersScreen} />
  </Stack.Navigator>
);

export default AccountNavigator;
