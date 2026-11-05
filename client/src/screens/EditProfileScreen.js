import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppText from "../components/AppText";
import Avatar from "../components/Avatar";
import colors from "../config/colors";
import useAuth from "../auth/useAuth";
import usersApi from "../api/users";

function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [avatarUri, setAvatarUri] = useState(user?.avatar || null);
  const [isNewAvatar, setIsNewAvatar] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);

  // Avatar picker handler
  const handlePickAvatar = async () => {
    const { granted } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      return Alert.alert(
        "Permission Denied",
        "Permission to access camera roll is required to upload a profile picture."
      );
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
        setIsNewAvatar(true);
        setRemoveAvatar(false);
      }
    } catch (err) {
      console.log("Error selecting image:", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const handleAvatarOptions = () => {
    const hasPhoto = (avatarUri || user?.avatar) && !removeAvatar;

    const options = [
      {
        text: "Choose from Library",
        onPress: handlePickAvatar,
      },
    ];

    if (hasPhoto) {
      options.push({
        text: "Remove Photo (Use Letter Initials)",
        style: "destructive",
        onPress: () => {
          setAvatarUri(null);
          setIsNewAvatar(false);
          setRemoveAvatar(true);
        },
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Profile Picture", "Update your profile picture", options);
  };

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      return Alert.alert(
        "Validation",
        "Name must be at least 2 characters long."
      );
    }

    if (password && password.length < 4) {
      return Alert.alert(
        "Validation",
        "New password must be at least 4 characters long."
      );
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        removeAvatar,
      };

      if (isNewAvatar && avatarUri) {
        payload.avatarUri = avatarUri;
      }
      if (password && password.trim()) {
        payload.password = password.trim();
      }

      const res = await usersApi.updateProfile(payload);
      setLoading(false);

      if (res.ok && res.data?.token) {
        updateUser(res.data.token);
        Alert.alert(
          "Profile Updated",
          "Your profile information has been successfully saved.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Update Failed",
          res.data?.error || "Could not update profile."
        );
      }
    } catch (err) {
      setLoading(false);
      console.log("Error updating profile:", err);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const currentDisplayedUri = removeAvatar
    ? null
    : isNewAvatar
    ? avatarUri
    : user?.avatar;

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Avatar
                uri={currentDisplayedUri}
                name={name || user?.name || "User"}
                size={110}
              />
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.8}
                onPress={handleAvatarOptions}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={20}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAvatarOptions}
              style={styles.changePhotoBtn}
            >
              <AppText style={styles.changePhotoText}>
                {currentDisplayedUri ? "Change Photo" : "Set Profile Photo"}
              </AppText>
            </TouchableOpacity>

            {!currentDisplayedUri && (
              <AppText style={styles.defaultAvatarNote}>
                Using Letter Avatar: Initial letters are automatically generated
                from your name
              </AppText>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Name */}
            <AppText style={styles.label}>Full Name</AppText>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="account-outline"
                size={22}
                color={colors.medium}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={colors.medium}
              />
            </View>

            {/* Email (Read Only) */}
            <AppText style={styles.label}>Email Address (Read Only)</AppText>
            <View style={[styles.inputWrapper, styles.readOnlyInput]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={22}
                color={colors.medium}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.medium }]}
                value={user?.email || ""}
                editable={false}
              />
            </View>

            {/* Bio */}
            <AppText style={styles.label}>Bio / About Me</AppText>
            <View style={[styles.inputWrapper, styles.multilineWrapper]}>
              <MaterialCommunityIcons
                name="text-short"
                size={22}
                color={colors.medium}
                style={[styles.inputIcon, { marginTop: 12 }]}
              />
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell buyers and sellers a bit about yourself..."
                placeholderTextColor={colors.medium}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Phone Number */}
            <AppText style={styles.label}>Phone Number (Optional)</AppText>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={22}
                color={colors.medium}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 234 567 8900"
                placeholderTextColor={colors.medium}
                keyboardType="phone-pad"
              />
            </View>

            {/* Change Password */}
            <AppText style={styles.label}>
              Change Password (Leave blank to keep current)
            </AppText>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={22}
                color={colors.medium}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="New password (optional)"
                placeholderTextColor={colors.medium}
                secureTextEntry
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={loading}
            onPress={handleSave}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <AppText style={styles.saveButtonText}>Save Changes</AppText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.light,
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  avatarWrapper: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  changePhotoBtn: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  defaultAvatarNote: {
    fontSize: 12,
    color: colors.medium,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 30,
  },
  formSection: {
    marginTop: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.medium,
    textTransform: "uppercase",
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  readOnlyInput: {
    backgroundColor: "#F1F5F9",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.dark,
  },
  multilineWrapper: {
    alignItems: "flex-start",
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});

export default EditProfileScreen;