import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppText from "../components/AppText";
import ActivityIndicator from "../components/ActivityIndicator";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import colors from "../config/colors";
import reviewsApi from "../api/reviews";
import routes from "../navigation/routes";
import { useWishlist } from "../context/WishlistContext";
import useAuth from "../auth/useAuth";

function SellerProfileScreen({ route, navigation }) {
  const { sellerId } = route.params;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useWishlist();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("listings"); // "listings" | "reviews"

  // Review Modal State
  const [isReviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await reviewsApi.getSellerProfile(sellerId);
      if (response.ok) {
        setProfile(response.data);
      } else {
        Alert.alert("Error", "Could not load seller profile.");
      }
    } catch (e) {
      console.log("Error loading seller profile", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [sellerId]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) {
      return Alert.alert("Validation", "Please write a brief comment.");
    }

    setSubmittingReview(true);
    const res = await reviewsApi.addReview(sellerId, {
      rating: selectedRating,
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);

    if (res.ok) {
      setReviewModalVisible(false);
      setReviewComment("");
      Alert.alert("Thank you!", "Your review has been submitted.");
      loadProfile();
    } else {
      Alert.alert("Error", res.data?.error || "Could not submit review.");
    }
  };

  if (loading || !profile) {
    return (
      <Screen style={styles.screen}>
        <ActivityIndicator visible={loading} />
      </Screen>
    );
  }

  const { seller, averageRating, totalReviews, listings, reviews } = profile;
  const memberSince = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Recently";

  const isSelf = user?.userId === sellerId;

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Profile Section */}
        <View style={styles.profileHeader}>
          <Avatar
            uri={seller.avatar}
            name={seller.name}
            size={90}
            style={styles.avatar}
          />
          <AppText style={styles.sellerName}>{seller.name}</AppText>
          <AppText style={styles.sellerEmail}>{seller.email}</AppText>
          <AppText style={styles.memberSince}>Member since {memberSince}</AppText>

          {/* Rating Summary */}
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={20} color="#ffb800" />
            <AppText style={styles.ratingScore}>
              {averageRating > 0 ? averageRating.toFixed(1) : "New"}
            </AppText>
            <AppText style={styles.ratingCount}>
              ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
            </AppText>
          </View>

          {/* Leave a Review Button (only if not self) */}
          {!isSelf && (
            <TouchableOpacity
              style={styles.writeReviewBtn}
              onPress={() => setReviewModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="star-box-multiple-outline"
                size={18}
                color={colors.white}
              />
              <AppText style={styles.writeReviewText}>Write a Review</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "listings" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("listings")}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === "listings" && styles.tabTextActive,
              ]}
            >
              Listings ({listings.length})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "reviews" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("reviews")}
          >
            <AppText
              style={[
                styles.tabText,
                activeTab === "reviews" && styles.tabTextActive,
              ]}
            >
              Reviews ({reviews.length})
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <View>
            {listings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AppText>No listings by this seller yet.</AppText>
              </View>
            ) : (
              listings.map((item) => {
                const listingId = item.id || item._id;
                return (
                  <Card
                    key={listingId}
                    title={item.title}
                    subTitle={"₹" + item.price}
                    condition={item.condition}
                    imageUrl={
                      item.images && item.images.length > 0
                        ? item.images[0].url
                        : null
                    }
                    thumbnailUrl={
                      item.images && item.images.length > 0
                        ? item.images[0].thumbnailUrl
                        : null
                    }
                    onPress={() =>
                      navigation.navigate(routes.LISTING_DETAILS, item)
                    }
                    isFavorite={isFavorite(listingId)}
                    onToggleFavorite={() => toggleFavorite(listingId)}
                  />
                );
              })
            )}
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <View style={styles.reviewsList}>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AppText>No reviews yet. Be the first to leave one!</AppText>
              </View>
            ) : (
              reviews.map((r) => (
                <View key={r.id || r._id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <AppText style={styles.reviewerName}>
                      {r.reviewerId?.name || "Customer"}
                    </AppText>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialCommunityIcons
                          key={s}
                          name={s <= r.rating ? "star" : "star-outline"}
                          size={16}
                          color="#ffb800"
                        />
                      ))}
                    </View>
                  </View>
                  <AppText style={styles.reviewComment}>{r.comment}</AppText>
                  <AppText style={styles.reviewDate}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </AppText>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Write Review Modal */}
      <Modal
        visible={isReviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Rate this Seller</AppText>
              <TouchableOpacity
                onPress={() => setReviewModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.dark}
                />
              </TouchableOpacity>
            </View>

            {/* Star Selector */}
            <AppText style={styles.inputLabel}>Select Rating:</AppText>
            <View style={styles.starSelectorRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                >
                  <MaterialCommunityIcons
                    name={star <= selectedRating ? "star" : "star-outline"}
                    size={40}
                    color="#ffb800"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comment Box */}
            <AppText style={styles.inputLabel}>Your Feedback:</AppText>
            <TextInput
              style={styles.reviewInput}
              placeholder="Describe your buying or communication experience..."
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            {/* Actions */}
            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReviewModalVisible(false)}
              >
                <AppText style={styles.modalCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                <AppText style={styles.modalSubmitText}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </AppText>
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
  profileHeader: {
    backgroundColor: colors.white,
    padding: 24,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  sellerName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sellerEmail: {
    color: colors.medium,
    fontSize: 14,
    marginBottom: 4,
  },
  memberSince: {
    color: colors.medium,
    fontSize: 13,
    marginBottom: 10,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 14,
  },
  ratingScore: {
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 4,
    marginRight: 6,
    color: "#b38000",
  },
  ratingCount: {
    color: colors.medium,
    fontSize: 13,
  },
  writeReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  writeReviewText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 15,
    backgroundColor: "#e8e8e8",
    borderRadius: 25,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: colors.medium,
    fontWeight: "600",
  },
  tabTextActive: {
    color: colors.dark,
    fontWeight: "bold",
  },
  reviewsList: {
    paddingHorizontal: 15,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerName: {
    fontWeight: "bold",
    fontSize: 15,
  },
  starsRow: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.medium,
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
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
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 8,
  },
  starSelectorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  reviewInput: {
    backgroundColor: colors.light,
    borderRadius: 14,
    padding: 14,
    height: 100,
    textAlignVertical: "top",
    fontSize: 15,
    marginBottom: 20,
  },
  modalActionButtons: {
    flexDirection: "row",
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.light,
    alignItems: "center",
    marginRight: 10,
  },
  modalCancelText: {
    color: colors.dark,
    fontWeight: "bold",
    fontSize: 16,
  },
  modalSubmitBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalSubmitText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SellerProfileScreen;
