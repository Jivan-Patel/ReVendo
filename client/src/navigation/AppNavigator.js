import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import FeedNavigator from "./FeedNavigator";
import ListingEditScreen from "../screens/ListingEditScreen";
import WishlistNavigator from "./WishlistNavigator";
import OffersScreen from "../screens/OffersScreen";
import MyListingsNavigator from "./MyListingsNavigator";
import NewListingButton from "./NewListingButton";
import routes from "./routes";
import colors from "../config/colors";
import useNotifications from "../hooks/useNotifications";
import { useWishlist } from "../context/WishlistContext";

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  useNotifications();
  const wishlistContext = useWishlist();
  const wishlistCount =
    wishlistContext?.favoriteIds?.length ||
    wishlistContext?.wishlistIds?.length ||
    0;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.medium,
        tabBarStyle: {
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistNavigator}
        options={{
          tabBarLabel: "Wishlist",
          tabBarBadge: wishlistCount > 0 ? wishlistCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="heart-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ListingEdit"
        component={ListingEditScreen}
        options={({ navigation }) => ({
          tabBarLabel: "Sell",
          tabBarButton: () => (
            <NewListingButton
              onPress={() => navigation.navigate(routes.LISTING_EDIT)}
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="plus-circle"
              color={color}
              size={size}
            />
          ),
        })}
      />
      <Tab.Screen
        name="OffersTab"
        component={OffersScreen}
        options={{
          tabBarLabel: "Offers",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="tag-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyListingsTab"
        component={MyListingsNavigator}
        options={{
          tabBarLabel: "My Listings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="format-list-bulleted"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
