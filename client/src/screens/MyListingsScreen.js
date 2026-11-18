import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import ActivityIndicator from "../components/ActivityIndicator";
import routes from "../navigation/routes";
import listingsApi from "../api/listings";
import { resolveImageUrl } from "../api/client";
import Screen from "../components/Screen";
import Card from "../components/Card";
import AppText from "../components/AppText";
import AppButton from "../components/AppButton";
import colors from "../config/colors";
import TopHeader from "../components/TopHeader";
import conditions, { getConditionMeta } from "../config/conditions";

function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Edit Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCondition, setEditCondition] = useState("Good");
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editNewImageUris, setEditNewImageUris] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadMyListings = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await listingsApi.getMyListings();
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
    loadMyListings();
  }, []);

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === "sold" ? "active" : "sold";
    const itemId = item.id || item._id;

    // Optimistic update
    setListings((prev) =>
      prev.map((l) =>
        (l.id || l._id) === itemId ? { ...l, status: newStatus } : l
      )
    );

    const res = await listingsApi.updateListingStatus(itemId, newStatus);
    if (!res.ok) {
      // Revert if failed
      setListings((prev) =>
        prev.map((l) =>
          (l.id || l._id) === itemId ? { ...l, status: item.status } : l
        )
      );
      Alert.alert("Error", "Could not update listing status.");
    }
  };

  const handleDelete = (item) => {
    const itemId = item.id || item._id;
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setListings((prev) =>
              prev.filter((l) => (l.id || l._id) !== itemId)
            );
            const res = await listingsApi.deleteListing(itemId);
            if (!res.ok) {
              Alert.alert("Error", "Could not delete listing.");
              loadMyListings();
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item) => {
    setEditingListing(item);
    setEditTitle(item.title);
    setEditPrice(item.price.toString());
    setEditDescription(item.description || "");
    setEditCondition(item.condition || "Good");
    setEditExistingImages(item.images ? [...item.images] : []);
    setEditNewImageUris([]);
    setEditModalVisible(true);
  };

  const handleAddPhotos = async () => {
    const { granted } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      return Alert.alert(
        "Permission Denied",
        "Permission to access media library is required to select photos."
      );
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);
        setEditNewImageUris((prev) => [...prev, ...uris]);
      }
    } catch (err) {
      console.log("Error selecting images:", err);
      Alert.alert("Error", "Could not pick images.");
    }
  };

  const handleRemoveExistingImage = (index) => {
    setEditExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setEditNewImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editPrice.trim()) {
      return Alert.alert("Validation", "Title and Price are required.");
    }

    if (editExistingImages.length === 0 && editNewImageUris.length === 0) {
      return Alert.alert(
        "Photos Required",
        "Please keep or upload at least one photo for your product."
      );
    }

    setSavingEdit(true);
    const itemId = editingListing.id || editingListing._id;
    const payload = {
      title: editTitle.trim(),
      price: Number(editPrice),
      description: editDescription.trim(),
      condition: editCondition,
      existingImages: editExistingImages,
      newImages: editNewImageUris,
    };

    const res = await listingsApi.updateListing(itemId, payload);
    setSavingEdit(false);

    if (res.ok && res.data) {
      setListings((prev) =>
        prev.map((l) =>
          (l.id || l._id) === itemId ? { ...l, ...res.data } : l
        )
      );
      setEditModalVisible(false);
      Alert.alert("Success", "Listing photos and details updated successfully!");
    } else {
      Alert.alert("Error", res.data?.error || "Could not save changes.");
    }
  };

  return (
    <Screen style={styles.screen}>
      <TopHeader title="My Listings" navigation={navigation} />
      <ActivityIndicator visible={loading} />

      {error && (
        <View style={styles.centerContainer}>
          <AppText>Couldn't retrieve your listings.</AppText>
          <AppButton title="Retry" onPress={loadMyListings} />
        </View>
      )}

      {listings.length === 0 && !loading && !error && (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="tag-outline"
            size={70}
            color={colors.medium}
          />
          <AppText style={styles.emptyTitle}>No Listings Yet</AppText>
          <AppText style={styles.emptySubtitle}>
            Listings you post will appear here for you to edit or mark as sold.
          </AppText>
        </View>
      )}

      <FlatList
        data={listings}
        keyExtractor={(item) => (item.id || item._id).toString()}
        renderItem={({ item }) => {
          const isSold = item.status === "sold";
          return (
            <View style={styles.cardWrapper}>
              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  isSold ? styles.badgeSold : styles.badgeActive,
                ]}
              >
                <AppText style={styles.statusBadgeText}>
                  {isSold ? "SOLD" : "ACTIVE"}
                </AppText>
              </View>

              <Card
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
              />

              {/* Management Actions */}
              <View style={styles.actionsBar}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isSold ? styles.actionActiveBtn : styles.actionSoldBtn,
                  ]}
                  onPress={() => handleToggleStatus(item)}
                >
                  <MaterialCommunityIcons
                    name={isSold ? "refresh" : "check-circle-outline"}
                    size={18}
                    color={colors.white}
                  />
                  <AppText style={styles.actionBtnText}>
                    {isSold ? "Relist Item" : "Mark as Sold"}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionEditBtn]}
                  onPress={() => openEditModal(item)}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color={colors.white}
                  />
                  <AppText style={styles.actionBtnText}>Edit</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionDeleteBtn]}
                  onPress={() => handleDelete(item)}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={colors.white}
                  />
                  <AppText style={styles.actionBtnText}>Delete</AppText>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        refreshing={loading}
        onRefresh={loadMyListings}
      />

      {/* Edit Listing Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Edit Listing</AppText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.dark}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Product Photos Section */}
              <View style={styles.photosSectionHeader}>
                <AppText style={styles.inputLabel}>Product Photos</AppText>
                <AppText style={styles.photosCount}>
                  {editExistingImages.length + editNewImageUris.length} photo(s)
                </AppText>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosRow}
              >
                {/* Add Photo Button */}
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  activeOpacity={0.8}
                  onPress={handleAddPhotos}
                >
                  <MaterialCommunityIcons
                    name="camera-plus-outline"
                    size={26}
                    color={colors.primary}
                  />
                  <AppText style={styles.addPhotoText}>Add Photo</AppText>
                </TouchableOpacity>

                {/* Existing Photos */}
                {editExistingImages.map((img, index) => (
                  <View key={`exist_${index}`} style={styles.photoThumbWrapper}>
                    <Image
                      style={styles.photoThumb}
                      source={{
                        uri: resolveImageUrl(img.thumbnailUrl || img.url),
                      }}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removePhotoBadge}
                      activeOpacity={0.7}
                      onPress={() => handleRemoveExistingImage(index)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={14}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Newly Picked Photos */}
                {editNewImageUris.map((uri, index) => (
                  <View key={`new_${index}`} style={styles.photoThumbWrapper}>
                    <Image
                      style={styles.photoThumb}
                      source={{ uri }}
                      contentFit="cover"
                    />
                    <View style={styles.newBadge}>
                      <AppText style={styles.newBadgeText}>NEW</AppText>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoBadge}
                      activeOpacity={0.7}
                      onPress={() => handleRemoveNewImage(index)}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={14}
                        color={colors.white}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <AppText style={styles.inputLabel}>Title</AppText>
              <TextInput
                style={styles.textInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Listing Title"
              />

              <AppText style={styles.inputLabel}>Price (₹)</AppText>
              <TextInput
                style={styles.textInput}
                value={editPrice}
                onChangeText={setEditPrice}
                placeholder="Price (₹)"
                keyboardType="numeric"
              />

              {/* Product Condition Selection */}
              <AppText style={styles.inputLabel}>Product Condition</AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.conditionChipsRow}
              >
                {conditions.map((item) => {
                  const isSelected = editCondition === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      activeOpacity={0.8}
                      style={[
                        styles.conditionChip,
                        isSelected && {
                          backgroundColor: item.color,
                          borderColor: item.color,
                        },
                      ]}
                      onPress={() => setEditCondition(item.value)}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={15}
                        color={isSelected ? colors.white : item.color}
                        style={{ marginRight: 4 }}
                      />
                      <AppText
                        style={[
                          styles.conditionChipText,
                          isSelected && styles.conditionChipTextSelected,
                        ]}
                      >
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {editCondition && (
                <View
                  style={[
                    styles.conditionHelpBox,
                    {
                      backgroundColor: getConditionMeta(editCondition).bg,
                      borderColor: getConditionMeta(editCondition).color + "30",
                    },
                  ]}
                >
                  <AppText
                    style={[
                      styles.conditionHelpText,
                      { color: getConditionMeta(editCondition).color },
                    ]}
                  >
                    {getConditionMeta(editCondition).description}
                  </AppText>
                </View>
              )}

              <AppText style={styles.inputLabel}>Description</AppText>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <AppText style={styles.modalCancelText}>Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                <AppText style={styles.modalSaveText}>
                  {savingEdit ? "Saving..." : "Save Changes"}
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
    paddingTop: 10,
  },
  cardWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  statusBadge: {
    position: "absolute",
    top: 22,
    left: 28,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 4,
  },
  badgeActive: {
    backgroundColor: "#2bcbba",
  },
  badgeSold: {
    backgroundColor: colors.danger,
  },
  statusBadgeText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 15,
    marginTop: -4,
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 3,
  },
  actionSoldBtn: {
    backgroundColor: colors.secondary,
  },
  actionActiveBtn: {
    backgroundColor: "#2bcbba",
  },
  actionEditBtn: {
    backgroundColor: colors.primary,
  },
  actionDeleteBtn: {
    backgroundColor: colors.danger,
  },
  actionBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 4,
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
    maxHeight: "80%",
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
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: colors.light,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActionButtons: {
    flexDirection: "row",
    marginTop: 20,
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
  modalSaveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalSaveText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  photosSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 5,
  },
  photosCount: {
    fontSize: 13,
    color: colors.medium,
    fontWeight: "600",
  },
  photosRow: {
    paddingVertical: 8,
    gap: 10,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 4,
  },
  photoThumbWrapper: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: "hidden",
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  removePhotoBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  newBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "bold",
  },
  conditionChipsRow: {
    paddingVertical: 4,
    gap: 8,
  },
  conditionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  conditionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.dark,
  },
  conditionChipTextSelected: {
    color: colors.white,
    fontWeight: "700",
  },
  conditionHelpBox: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  conditionHelpText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default MyListingsScreen;
