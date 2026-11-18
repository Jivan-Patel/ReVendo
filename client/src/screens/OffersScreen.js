import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
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
import colors from "../config/colors";
import offersApi from "../api/offers";
import { resolveImageUrl } from "../api/client";
import routes from "../navigation/routes";
import TopHeader from "../components/TopHeader";

function OffersScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("received"); // "received" | "sent"
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Counter Offer Modal State (for Seller)
  const [isCounterModalVisible, setCounterModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPriceInput, setCounterPriceInput] = useState("");
  const [submittingCounter, setSubmittingCounter] = useState(false);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const [receivedRes, sentRes] = await Promise.all([
        offersApi.getReceivedOffers(),
        offersApi.getSentOffers(),
      ]);
      if (receivedRes.ok) setReceivedOffers(receivedRes.data || []);
      if (sentRes.ok) setSentOffers(sentRes.data || []);
    } catch (e) {
      console.log("Error loading offers", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // Seller Actions: Accept or Decline
  const handleSellerAction = async (offerId, action) => {
    const res = await offersApi.respondToOffer(offerId, { action });
    if (res.ok) {
      setReceivedOffers((prev) =>
        prev.map((o) =>
          (o.id || o._id) === offerId
            ? { ...o, status: action === "accept" ? "accepted" : "declined" }
            : o
        )
      );
      Alert.alert(
        action === "accept" ? "Offer Accepted!" : "Offer Declined",
        action === "accept"
          ? "The buyer has been notified."
          : "The buyer will be notified."
      );
    } else {
      Alert.alert("Error", res.data?.error || "Could not process offer.");
    }
  };

  // Seller Action: Open Counter Modal
  const openCounterModal = (offer) => {
    setSelectedOffer(offer);
    setCounterPriceInput(offer.originalPrice.toString());
    setCounterModalVisible(true);
  };

  // Seller Action: Submit Counter Offer
  const handleSubmitCounter = async () => {
    if (!counterPriceInput || Number(counterPriceInput) <= 0) {
      return Alert.alert("Validation", "Please enter a valid counter price.");
    }

    setSubmittingCounter(true);
    const offerId = selectedOffer.id || selectedOffer._id;
    const res = await offersApi.respondToOffer(offerId, {
      action: "counter",
      counterPrice: Number(counterPriceInput),
    });
    setSubmittingCounter(false);

    if (res.ok) {
      setReceivedOffers((prev) =>
        prev.map((o) =>
          (o.id || o._id) === offerId
            ? {
                ...o,
                status: "countered",
                counterPrice: Number(counterPriceInput),
              }
            : o
        )
      );
      setCounterModalVisible(false);
      Alert.alert("Counter-Offer Sent", "The buyer has been notified.");
    } else {
      Alert.alert("Error", res.data?.error || "Could not send counter-offer.");
    }
  };

  // Buyer Action: Respond to Counter Offer
  const handleBuyerCounterResponse = async (offerId, action) => {
    const res = await offersApi.buyerRespond(offerId, { action });
    if (res.ok) {
      setSentOffers((prev) =>
        prev.map((o) =>
          (o.id || o._id) === offerId
            ? { ...o, status: action === "accept" ? "accepted" : "declined" }
            : o
        )
      );
      Alert.alert(
        action === "accept" ? "Counter-Offer Accepted!" : "Counter Declined",
        action === "accept"
          ? "The seller has been notified."
          : "The offer was closed."
      );
    } else {
      Alert.alert("Error", res.data?.error || "Could not respond to counter.");
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "accepted":
        return styles.badgeAccepted;
      case "declined":
        return styles.badgeDeclined;
      case "countered":
        return styles.badgeCountered;
      default:
        return styles.badgePending;
    }
  };

  const currentList = activeTab === "received" ? receivedOffers : sentOffers;

  return (
    <Screen style={styles.screen}>
      <TopHeader title="My Offers" navigation={navigation} />
      <ActivityIndicator visible={loading} />

      {/* Tabs Header */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "received" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("received")}
        >
          <AppText
            style={[
              styles.tabText,
              activeTab === "received" && styles.tabTextActive,
            ]}
          >
            Received ({receivedOffers.length})
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "sent" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("sent")}
        >
          <AppText
            style={[
              styles.tabText,
              activeTab === "sent" && styles.tabTextActive,
            ]}
          >
            Sent ({sentOffers.length})
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {currentList.length === 0 && !loading && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="handshake-outline"
            size={70}
            color={colors.medium}
          />
          <AppText style={styles.emptyTitle}>
            No {activeTab === "received" ? "Received" : "Sent"} Offers
          </AppText>
          <AppText style={styles.emptySubtitle}>
            {activeTab === "received"
              ? "When buyers make an offer on your listings, they will appear here."
              : "Offers you make on other sellers' items will appear here."}
          </AppText>
        </View>
      )}

      {/* Offers List */}
      <FlatList
        data={currentList}
        keyExtractor={(item) => (item.id || item._id).toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const offerId = item.id || item._id;
          const listing = item.listingId || {};
          const isReceived = activeTab === "received";
          const otherUser = isReceived ? item.buyerId : item.sellerId;
          const imgUrl =
            listing.images && listing.images.length > 0
              ? resolveImageUrl(listing.images[0].url)
              : null;

          const discountPct = Math.round(
            ((item.originalPrice - item.offeredPrice) / item.originalPrice) * 100
          );

          return (
            <View style={styles.offerCard}>
              {/* Header Info */}
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={0.8}
                onPress={() => {
                  if (listing.title) {
                    navigation.navigate(routes.LISTING_DETAILS, listing);
                  }
                }}
              >
                <Image
                  source={{ uri: imgUrl }}
                  style={styles.listingThumb}
                  contentFit="cover"
                />
                <View style={styles.listingDetails}>
                  <AppText numberOfLines={1} style={styles.listingTitle}>
                    {listing.title || "Listing"}
                  </AppText>
                  <AppText style={styles.userRoleText}>
                    {isReceived
                      ? `From: ${otherUser?.name || "Buyer"}`
                      : `To: ${otherUser?.name || "Seller"}`}
                  </AppText>
                  <AppText style={styles.originalPriceText}>
                    Asking: ₹{item.originalPrice}
                  </AppText>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    getStatusBadgeStyle(item.status),
                  ]}
                >
                  <AppText style={styles.statusBadgeText}>
                    {item.status.toUpperCase()}
                  </AppText>
                </View>
              </TouchableOpacity>

              {/* Price Breakdown */}
              <View style={styles.priceRow}>
                <View>
                  <AppText style={styles.priceLabel}>Offered Amount</AppText>
                  <View style={styles.offerAmountRow}>
                    <AppText style={styles.offeredAmountText}>
                      ₹{item.offeredPrice}
                    </AppText>
                    {discountPct > 0 && (
                      <View style={styles.discountBadge}>
                        <AppText style={styles.discountText}>
                          -{discountPct}%
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>

                {item.counterPrice && (
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText style={styles.priceLabel}>Counter-Offer</AppText>
                    <AppText style={styles.counterAmountText}>
                      ₹{item.counterPrice}
                    </AppText>
                  </View>
                )}
              </View>

              {/* Message if present */}
              {item.message ? (
                <View style={styles.messageBox}>
                  <MaterialCommunityIcons
                    name="message-text-outline"
                    size={16}
                    color={colors.medium}
                    style={{ marginRight: 6 }}
                  />
                  <AppText style={styles.messageText}>"{item.message}"</AppText>
                </View>
              ) : null}

              {/* Seller Actions (for received & pending offers) */}
              {isReceived && item.status === "pending" && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptBtn]}
                    onPress={() => handleSellerAction(offerId, "accept")}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={18}
                      color={colors.white}
                    />
                    <AppText style={styles.actionBtnText}>Accept</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.counterBtn]}
                    onPress={() => openCounterModal(item)}
                  >
                    <MaterialCommunityIcons
                      name="swap-horizontal"
                      size={18}
                      color={colors.white}
                    />
                    <AppText style={styles.actionBtnText}>Counter</AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineBtn]}
                    onPress={() => handleSellerAction(offerId, "decline")}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={18}
                      color={colors.white}
                    />
                    <AppText style={styles.actionBtnText}>Decline</AppText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Buyer Actions (if seller sent a counter-offer) */}
              {!isReceived && item.status === "countered" && (
                <View style={styles.counterPromptContainer}>
                  <AppText style={styles.counterPromptText}>
                    Seller proposed a counter-offer of ₹{item.counterPrice}:
                  </AppText>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptBtn]}
                      onPress={() =>
                        handleBuyerCounterResponse(offerId, "accept")
                      }
                    >
                      <AppText style={styles.actionBtnText}>
                        Accept ₹{item.counterPrice}
                      </AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineBtn]}
                      onPress={() =>
                        handleBuyerCounterResponse(offerId, "decline")
                      }
                    >
                      <AppText style={styles.actionBtnText}>Decline</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        refreshing={loading}
        onRefresh={loadOffers}
      />

      {/* Counter Offer Modal */}
      <Modal
        visible={isCounterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Counter-Offer</AppText>
              <TouchableOpacity
                onPress={() => setCounterModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.dark}
                />
              </TouchableOpacity>
            </View>

            <AppText style={styles.counterHelperText}>
              Original Asking: ₹{selectedOffer?.originalPrice} | Buyer Offered: ₹
              {selectedOffer?.offeredPrice}
            </AppText>

            <AppText style={styles.inputLabel}>Your Counter Price (₹)</AppText>
            <TextInput
              style={styles.counterInput}
              keyboardType="numeric"
              placeholder="Enter counter price (₹)"
              value={counterPriceInput}
              onChangeText={setCounterPriceInput}
            />

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCounterModalVisible(false)}
              >
                <AppText style={styles.modalCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitCounter}
                disabled={submittingCounter}
              >
                <AppText style={styles.modalSubmitText}>
                  {submittingCounter ? "Sending..." : "Send Counter"}
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
  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 12,
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
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  listingThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  listingDetails: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  userRoleText: {
    fontSize: 13,
    color: colors.medium,
    marginBottom: 2,
  },
  originalPriceText: {
    fontSize: 12,
    color: colors.medium,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePending: {
    backgroundColor: "#ffeaa7",
  },
  badgeAccepted: {
    backgroundColor: "#d4edda",
  },
  badgeDeclined: {
    backgroundColor: "#f8d7da",
  },
  badgeCountered: {
    backgroundColor: "#cce5ff",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.dark,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  priceLabel: {
    fontSize: 12,
    color: colors.medium,
    marginBottom: 2,
  },
  offerAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  offeredAmountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 8,
  },
  counterAmountText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0056b3",
  },
  discountBadge: {
    backgroundColor: "#ffebeb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "bold",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light,
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  messageText: {
    fontSize: 13,
    color: colors.dark,
    fontStyle: "italic",
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 3,
  },
  acceptBtn: {
    backgroundColor: "#2bcbba",
  },
  counterBtn: {
    backgroundColor: "#4b7bec",
  },
  declineBtn: {
    backgroundColor: colors.danger,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 4,
  },
  counterPromptContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#e8e8e8",
  },
  counterPromptText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 6,
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
    fontSize: 14,
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  counterHelperText: {
    fontSize: 13,
    color: colors.medium,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  counterInput: {
    backgroundColor: colors.light,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    fontWeight: "bold",
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

export default OffersScreen;
