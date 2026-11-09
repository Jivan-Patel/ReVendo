import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import ActivityIndicator from "../components/ActivityIndicator";
import routes from "../navigation/routes";
import colors from "../config/colors";
import listingsApi from "../api/listings";
import Screen from "../components/Screen";
import Card from "../components/Card";
import AppText from "../components/AppText";
import AppButton from "../components/AppButton";
import Avatar from "../components/Avatar";
import TopHeader from "../components/TopHeader";
import categories from "../config/categories";
import conditions from "../config/conditions";
import { useWishlist } from "../context/WishlistContext";
import recentlyViewed from "../utility/recentlyViewed";
import { resolveImageUrl } from "../api/client";
import useAuth from "../auth/useAuth";
import useLocation from "../hooks/useLocation";

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Distance: Closest", value: "distance" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

function ListingsScreen({ navigation }) {
  const { user } = useAuth();
  const location = useLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [distanceRadius, setDistanceRadius] = useState(null); // null | 5 | 10 | 25 | 50
  const [selectedCondition, setSelectedCondition] = useState(null); // null | "Brand New" | "Like New" | "Good" | "Fair" | "For Parts"
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Recently Viewed State
  const [recentItems, setRecentItems] = useState([]);

  const { isFavorite, toggleFavorite } = useWishlist();

  const loadRecentItems = async () => {
    const items = await recentlyViewed.getRecentlyViewed();
    setRecentItems(items || []);
  };

  useEffect(() => {
    loadRecentItems();
    const unsubscribe = navigation.addListener("focus", loadRecentItems);
    return unsubscribe;
  }, [navigation]);

  const handleClearRecent = async () => {
    await recentlyViewed.clearRecentlyViewed();
    setRecentItems([]);
  };

  const loadListings = async () => {
    setLoading(true);
    setError(false);

    const params = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedCategory) params.categoryId = selectedCategory;
    if (selectedCondition) params.condition = selectedCondition;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sort = sortBy;

    if (location && location.latitude && location.longitude) {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      if (distanceRadius) params.radius = distanceRadius;
    }

    try {
      const response = await listingsApi.getListings(params);
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
    const timer = setTimeout(() => {
      loadListings();
    }, 300);
    return () => clearTimeout(timer);
  }, [
    searchQuery,
    selectedCategory,
    selectedCondition,
    minPrice,
    maxPrice,
    sortBy,
    distanceRadius,
    location,
  ]);

  const handleApplyFilters = () => {
    setFilterModalVisible(false);
    loadListings();
  };

  const handleResetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSelectedCategory(null);
    setSelectedCondition(null);
    setSearchQuery("");
    setDistanceRadius(null);
    setFilterModalVisible(false);
  };

  const hasActiveFilters = Boolean(
    minPrice ||
      maxPrice ||
      sortBy !== "newest" ||
      selectedCategory ||
      selectedCondition ||
      distanceRadius !== null
  );

  return (
    <Screen style={styles.screen}>
      <TopHeader showBrand={true} navigation={navigation} />

      {/* Search Bar Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={22}
            color={colors.medium}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search items, brands, categories..."
            placeholderTextColor={colors.medium}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={colors.medium}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            hasActiveFilters && styles.filterButtonActive,
          ]}
          onPress={() => setFilterModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="tune"
            size={22}
            color={hasActiveFilters ? colors.white : colors.dark}
          />
        </TouchableOpacity>
      </View>

      {/* Category Pills Carousel */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <AppText
              style={[
                styles.categoryText,
                selectedCategory === null && styles.categoryTextActive,
              ]}
            >
              All
            </AppText>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() =>
                  setSelectedCategory(isSelected ? null : cat.value)
                }
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={16}
                  color={isSelected ? colors.white : colors.medium}
                  style={{ marginRight: 5 }}
                />
                <AppText
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Recently Viewed Carousel */}
      {!hasActiveFilters && searchQuery.length === 0 && recentItems.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <View style={styles.recentTitleRow}>
              <MaterialCommunityIcons
                name="history"
                size={18}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <AppText style={styles.recentTitle}>Recently Viewed</AppText>
            </View>
            <TouchableOpacity onPress={handleClearRecent}>
              <AppText style={styles.clearRecentText}>Clear</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScrollContent}
          >
            {recentItems.map((item) => {
              const itemId = (item.id || item._id).toString();
              const imgUrl =
                item.images && item.images.length > 0
                  ? resolveImageUrl(item.images[0].url)
                  : null;
              return (
                <TouchableOpacity
                  key={itemId}
                  style={styles.recentCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate(routes.LISTING_DETAILS, item)
                  }
                >
                  <Image
                    source={{ uri: imgUrl }}
                    style={styles.recentImage}
                    contentFit="cover"
                  />
                  <View style={styles.recentDetails}>
                    <AppText numberOfLines={1} style={styles.recentCardTitle}>
                      {item.title}
                    </AppText>
                    <AppText style={styles.recentCardPrice}>
                      ₹{item.price}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Feed Content */}
      {error && (
        <View style={styles.centerContainer}>
          <AppText>Couldn't retrieve listings.</AppText>
          <AppButton title="Retry" onPress={loadListings} />
        </View>
      )}

      <ActivityIndicator visible={loading} />

      {listings.length === 0 && !loading && !error && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="tag-search-outline"
            size={60}
            color={colors.medium}
          />
          <AppText style={styles.noResultsTitle}>No Listings Found</AppText>
          <AppText style={styles.noResultsSubtitle}>
            Try clearing filters or search for something else.
          </AppText>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.resetButton}
            >
              <AppText style={styles.resetButtonText}>Reset All Filters</AppText>
            </TouchableOpacity>
          )}
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
              onToggleFavorite={() => toggleFavorite(listingId)}
            />
          );
        }}
        refreshing={loading}
        onRefresh={loadListings}
      />

      {/* Filter & Sort Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Filters & Sorting</AppText>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sort By */}
              <AppText style={styles.filterSectionTitle}>Sort By</AppText>
              <View style={styles.sortOptionsContainer}>
                {sortOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.sortOption,
                      sortBy === opt.value && styles.sortOptionActive,
                    ]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <AppText
                      style={[
                        styles.sortOptionText,
                        sortBy === opt.value && styles.sortOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Distance / Near Me */}
              <AppText style={styles.filterSectionTitle}>
                Distance (Near Me)
              </AppText>
              <View style={styles.chipsRow}>
                {[
                  { label: "Any Distance", value: null },
                  { label: "Within 5 km", value: 5 },
                  { label: "Within 10 km", value: 10 },
                  { label: "Within 25 km", value: 25 },
                  { label: "Within 50 km", value: 50 },
                ].map((item) => {
                  const isSelected = distanceRadius === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setDistanceRadius(item.value)}
                    >
                      <AppText
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Product Condition Filter */}
              <AppText style={styles.filterSectionTitle}>
                Product Condition
              </AppText>
              <View style={styles.chipsRow}>
                {[
                  { label: "All Conditions", value: null },
                  ...conditions.map((c) => ({
                    label: c.label,
                    value: c.value,
                    color: c.color,
                    icon: c.icon,
                  })),
                ].map((item) => {
                  const isSelected = selectedCondition === item.value;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: item.color || colors.primary,
                          borderColor: item.color || colors.primary,
                        },
                      ]}
                      onPress={() => setSelectedCondition(item.value)}
                    >
                      {item.icon && (
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={14}
                          color={isSelected ? colors.white : item.color}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <AppText
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Range */}
              <AppText style={styles.filterSectionTitle}>Price Range (₹)</AppText>
              <View style={styles.priceRow}>
                <TextInput
                  placeholder="Min (₹)"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  style={styles.priceInput}
                />
                <AppText style={{ marginHorizontal: 10, color: colors.medium }}>
                  to
                </AppText>
                <TextInput
                  placeholder="Max (₹)"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  style={styles.priceInput}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={handleResetFilters}
              >
                <AppText style={styles.modalResetText}>Reset</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={handleApplyFilters}
              >
                <AppText style={styles.modalApplyText}>Apply Filters</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.light,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 22,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  categoriesContainer: {
    marginBottom: 4,
  },
  categoriesContent: {
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.medium,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: "bold",
  },
  recentSection: {
    paddingVertical: 8,
    backgroundColor: colors.white,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ebebeb",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 8,
  },
  recentTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.dark,
  },
  clearRecentText: {
    fontSize: 13,
    color: colors.medium,
  },
  recentScrollContent: {
    paddingHorizontal: 15,
  },
  recentCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: colors.light,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  recentImage: {
    width: "100%",
    height: 85,
  },
  recentDetails: {
    padding: 6,
  },
  recentCardTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  recentCardPrice: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "bold",
    marginTop: 2,
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 6,
  },
  noResultsSubtitle: {
    color: colors.medium,
    textAlign: "center",
    fontSize: 15,
    marginBottom: 15,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  sortOptionsContainer: {
    flexDirection: "column",
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.light,
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.dark,
  },
  sortOptionTextActive: {
    color: colors.white,
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 15,
  },
  modalResetButton: {
    flex: 1,
    backgroundColor: colors.light,
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginRight: 10,
  },
  modalResetText: {
    color: colors.dark,
    fontWeight: "bold",
    fontSize: 16,
  },
  modalApplyButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
  },
  modalApplyText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: colors.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: colors.white,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.dark,
    letterSpacing: -0.5,
  },
  brandHighlight: {
    color: colors.primary,
    fontWeight: "800",
  },
  topAvatarBtn: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
});

export default ListingsScreen;
