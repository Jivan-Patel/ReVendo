import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import ActivityIndicator from "../components/ActivityIndicator";
import routes from "../navigation/routes";
import wishlistApi from "../api/wishlist";
import Screen from "../components/Screen";
import Card from "../components/Card";
import AppText from "../components/AppText";
import AppButton from "../components/AppButton";
import colors from "../config/colors";
import { useWishlist } from "../context/WishlistContext";
import TopHeader from "../components/TopHeader";

function WishlistScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { isFavorite, toggleFavorite } = useWishlist();

  const loadWishlist = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await wishlistApi.getWishlist();
      if (!response.ok) {
        setError(true);
      } else {
        setListings(response.data || []);
      }
    } catch (e) {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleToggle = async (listingId) => {
    await toggleFavorite(listingId);
    // Remove from local list view immediately
    setListings((prev) =>
      prev.filter((item) => (item.id || item._id) !== listingId)
    );
  };

  return (
    <Screen style={styles.screen}>
      <TopHeader title="My Wishlist" navigation={navigation} />
      <ActivityIndicator visible={loading} />

      {error && (
        <View style={styles.centerContainer}>
          <AppText>Couldn't retrieve your wishlist.</AppText>
          <AppButton title="Retry" onPress={loadWishlist} />
        </View>
      )}

      {listings.length === 0 && !loading && !error && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={70}
            color={colors.medium}
          />
          <AppText style={styles.emptyTitle}>Your Wishlist is Empty</AppText>
          <AppText style={styles.emptySubtitle}>
            Tap the heart icon on any listing to save items for later.
          </AppText>
        </View>
      )}

      <FlatList
        data={listings}
        keyExtractor={(item) => (item.id || item._id).toString()}
        renderItem={({ item }) => {
          const listingId = item.id || item._id;
          return (
            <Card
              title={item.title}
              subTitle={"₹" + item.price}
              condition={item.condition}
              distance={item.distance}
              imageUrl={
                item.images && item.images.length > 0 ? item.images[0].url : null
              }
              thumbnailUrl={
                item.images && item.images.length > 0
                  ? item.images[0].thumbnailUrl
                  : null
              }
              onPress={() => navigation.navigate(routes.LISTING_DETAILS, item)}
              isFavorite={isFavorite(listingId)}
              onToggleFavorite={() => handleToggle(listingId)}
            />
          );
        }}
        refreshing={loading}
        onRefresh={loadWishlist}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.light,
    paddingTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    color: colors.medium,
    fontSize: 15,
  },
});

export default WishlistScreen;
