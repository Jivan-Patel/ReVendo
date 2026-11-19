import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AppText from "../components/AppText";
import colors from "../config/colors";
import ListItem from "../components/ListItem";
import { resolveImageUrl } from "../api/client";
import { useWishlist } from "../context/WishlistContext";
import routes from "../navigation/routes";
import recentlyViewed from "../utility/recentlyViewed";
import useAuth from "../auth/useAuth";
import offersApi from "../api/offers";
import { getConditionMeta } from "../config/conditions";

function ListingDetailsScreen({ route, navigation }) {
  const listing = route.params;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { width: screenWidth } = useWindowDimensions();

  const listingId = listing.id || listing._id;
  const isFav = isFavorite(listingId);
  const sellerId = listing.userId?._id || listing.userId?.id || listing.userId;
  const isOwner = user && (user.userId === sellerId || user._id === sellerId);
  const conditionMeta = getConditionMeta(listing.condition || "Good");

  // Multi-Image Carousel & Fullscreen Viewer state
  const images =
    listing.images && listing.images.length > 0 ? listing.images : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);

  // Make an Offer modal state
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  useEffect(() => {
    recentlyViewed.addRecentlyViewed(listing);
  }, [listingId]);

  const handleOpenOfferModal = () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please login or register to make an offer.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => navigation.navigate(routes.LOGIN) },
        ]
      );
      return;
    }
    const defaultDiscounted = Math.round(listing.price * 0.9);
    setOfferPrice(defaultDiscounted > 0 ? defaultDiscounted.toString() : "");
    setOfferNote("");
    setOfferModalVisible(true);
  };

  const handleSendOffer = async () => {
    const numPrice = Number(offerPrice);
    if (!offerPrice || isNaN(numPrice) || numPrice <= 0) {
      return Alert.alert(
        "Invalid Price",
        "Please enter a valid offer amount greater than 0."
      );
    }

    setSubmittingOffer(true);
    const result = await offersApi.createOffer({
      listingId,
      offeredPrice: numPrice,
      message: offerNote,
    });
    setSubmittingOffer(false);

    if (result.ok) {
      setOfferModalVisible(false);
      Alert.alert(
        "Offer Sent! 🎉",
        `Your offer of ₹${numPrice} has been sent to the seller. You can monitor seller responses in My Offers.`,
        [
          { text: "Done" },
          {
            text: "View My Offers",
            onPress: () => navigation.navigate(routes.OFFERS),
          },
        ]
      );
    } else {
      Alert.alert(
        "Could Not Send Offer",
        result.data?.error || "An error occurred while submitting your offer."
      );
    }
  };

  const handleOpenChat = () => {
    if (!user) {
      return Alert.alert(
        "Login Required",
        "Please log in to chat with the seller.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log In", onPress: () => navigation.navigate(routes.LOGIN) },
        ]
      );
    }
    navigation.navigate(routes.CHAT, {
      listing,
      otherUser: listing.userId,
    });
  };

  const discountPercentages = [5, 10, 15, 20];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1, backgroundColor: colors.white }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Multi-Image Swipe Carousel */}
        <View style={styles.carouselContainer}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / screenWidth
                );
                setActiveImageIndex(index);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setImageViewerVisible(true)}
                >
                  <Image
                    style={[styles.carouselImage, { width: screenWidth }]}
                    source={{ uri: resolveImageUrl(item.url) }}
                    placeholder={{ uri: resolveImageUrl(item.thumbnailUrl) }}
                    contentFit="cover"
                    transition={250}
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={[styles.placeholderImage, { width: screenWidth }]}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={48}
                color={colors.medium}
              />
            </View>
          )}

          {/* Image Counter Badge */}
          {images.length > 1 && (
            <View style={styles.counterBadge}>
              <AppText style={styles.counterBadgeText}>
                {activeImageIndex + 1} / {images.length}
              </AppText>
            </View>
          )}

          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeImageIndex === idx && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Wishlist Heart Button */}
          <TouchableOpacity
            style={styles.heartButton}
            activeOpacity={0.7}
            onPress={() => toggleFavorite(listingId)}
          >
            <MaterialCommunityIcons
              name={isFav ? "heart" : "heart-outline"}
              size={26}
              color={isFav ? colors.primary : colors.medium}
            />
          </TouchableOpacity>
        </View>

        {/* Listing Details Header */}
        <View style={styles.detailsContainer}>
          <View style={styles.titlePriceRow}>
            <View style={{ flex: 1 }}>
              <AppText style={styles.title}>{listing.title}</AppText>
              <AppText style={styles.price}>₹{listing.price}</AppText>
            </View>

            {listing.distance !== undefined && listing.distance !== null && (
              <View style={styles.distanceBadge}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={16}
                  color={colors.primary}
                  style={{ marginRight: 4 }}
                />
                <AppText style={styles.distanceText}>
                  {listing.distance} km away
                </AppText>
              </View>
            )}
          </View>

          {/* Product Condition Banner */}
          <View
            style={[
              styles.conditionBox,
              {
                backgroundColor: conditionMeta.bg,
                borderColor: conditionMeta.color + "30",
              },
            ]}
          >
            <View style={styles.conditionHeaderRow}>
              <View
                style={[
                  styles.conditionIconBadge,
                  { backgroundColor: conditionMeta.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={conditionMeta.icon}
                  size={14}
                  color={colors.white}
                />
              </View>
              <AppText
                style={[styles.conditionTitle, { color: conditionMeta.color }]}
              >
                {conditionMeta.label}
              </AppText>
            </View>
            <AppText style={styles.conditionDesc}>
              {conditionMeta.description}
            </AppText>
          </View>

          {/* Description */}
          {listing.description ? (
            <View style={styles.descriptionContainer}>
              <AppText style={styles.descriptionHeading}>Description</AppText>
              <AppText style={styles.descriptionText}>
                {listing.description}
              </AppText>
            </View>
          ) : null}

          {/* Action Row for Non-Owners: Chat with Seller & Make an Offer */}
          {!isOwner && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.chatButton}
                activeOpacity={0.8}
                onPress={handleOpenChat}
              >
                <MaterialCommunityIcons
                  name="chat-processing-outline"
                  size={20}
                  color={colors.white}
                  style={{ marginRight: 6 }}
                />
                <AppText style={styles.chatButtonText}>Chat with Seller</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.offerButton}
                activeOpacity={0.8}
                onPress={handleOpenOfferModal}
              >
                <MaterialCommunityIcons
                  name="tag-outline"
                  size={20}
                  color={colors.white}
                  style={{ marginRight: 6 }}
                />
                <AppText style={styles.offerButtonText}>Make an Offer</AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* Seller Card */}
          <View style={styles.userContainer}>
            <ListItem
              avatarUri={listing.userId?.avatar}
              title={listing.userId?.name || "Seller Profile"}
              subTitle="Tap to view reviews & ratings"
              showChevrons={true}
              onPress={() => {
                if (sellerId) {
                  navigation.navigate(routes.SELLER_PROFILE, { sellerId });
                }
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={isImageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setImageViewerVisible(false)}
          >
            <MaterialCommunityIcons name="close" size={28} color={colors.white} />
          </TouchableOpacity>

          <FlatList
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={activeImageIndex}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View style={[styles.fullscreenSlide, { width: screenWidth }]}>
                <Image
                  style={styles.fullscreenImage}
                  source={{ uri: resolveImageUrl(item.url) }}
                  contentFit="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Make an Offer Modal */}
      <Modal
        visible={offerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <AppText style={styles.modalTitle}>Make an Offer</AppText>
                <AppText style={styles.modalSubtitle}>
                  Asking Price: ₹{listing.price}
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setOfferModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.medium}
                />
              </TouchableOpacity>
            </View>

            {/* Quick Discount Suggestions */}
            <AppText style={styles.chipHeader}>Quick Suggestions</AppText>
            <View style={styles.chipsRow}>
              {discountPercentages.map((pct) => {
                const calculated = Math.round(
                  listing.price * (1 - pct / 100)
                );
                const isSelected = offerPrice === calculated.toString();
                return (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setOfferPrice(calculated.toString())}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      -{pct}% (₹{calculated})
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price Input */}
            <AppText style={styles.inputLabel}>Your Offer Price (₹)</AppText>
            <View style={styles.priceInputWrapper}>
              <AppText style={styles.dollarSign}>₹</AppText>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                placeholder="0"
                value={offerPrice}
                onChangeText={setOfferPrice}
              />
            </View>

            {/* Optional Note */}
            <AppText style={styles.inputLabel}>Note to Seller (Optional)</AppText>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={3}
              placeholder="e.g. Can pick up today with cash"
              value={offerNote}
              onChangeText={setOfferNote}
            />

            {/* Modal Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setOfferModalVisible(false)}
              >
                <AppText style={styles.cancelBtnText}>Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitOfferBtn,
                  submittingOffer && { opacity: 0.7 },
                ]}
                disabled={submittingOffer}
                onPress={handleSendOffer}
              >
                {submittingOffer ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <AppText style={styles.submitOfferBtnText}>Send Offer</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    position: "relative",
    width: "100%",
    height: 310,
    backgroundColor: "#F1F5F9",
  },
  carouselImage: {
    height: 310,
  },
  placeholderImage: {
    height: 310,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  paginationDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  heartButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  detailsContainer: {
    padding: 20,
  },
  titlePriceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  price: {
    color: colors.secondary,
    fontWeight: "bold",
    fontSize: 24,
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.dark,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  conditionBox: {
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  conditionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  conditionIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  conditionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  conditionDesc: {
    fontSize: 13,
    color: colors.medium,
    lineHeight: 18,
  },
  descriptionContainer: {
    marginVertical: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  descriptionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.dark,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.medium,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 25,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  chatButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  offerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    paddingVertical: 13,
    borderRadius: 25,
    elevation: 3,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  offerButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  userContainer: {
    marginTop: 10,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  closeModalBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenSlide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.medium,
    marginTop: 2,
  },
  chipHeader: {
    fontSize: 13,
    color: colors.medium,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
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
  inputLabel: {
    fontSize: 13,
    color: colors.medium,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.secondary,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    height: 48,
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
  },
  noteInput: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.dark,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: colors.medium,
    fontWeight: "bold",
    fontSize: 16,
  },
  submitOfferBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitOfferBtnText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ListingDetailsScreen;
