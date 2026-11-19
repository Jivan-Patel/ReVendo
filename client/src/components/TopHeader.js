import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppText from "./AppText";
import Avatar from "./Avatar";
import colors from "../config/colors";
import useAuth from "../auth/useAuth";

function TopHeader({
  title,
  showBrand = false,
  showBack = false,
  navigation,
  style,
}) {
  const { user } = useAuth();

  const handleAccountPress = () => {
    if (!navigation) return;
    try {
      navigation.navigate("Account");
    } catch (e) {
      try {
        navigation.navigate("Feed", { screen: "Account" });
      } catch (err) {
        console.log("Navigation error:", err);
      }
    }
  };

  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftContainer}>
        {showBack && navigation?.canGoBack && navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.dark}
            />
          </TouchableOpacity>
        )}

        {showBrand ? (
          <View style={styles.brandRow}>
            <AppText style={styles.brandTitle}>
              Re<AppText style={styles.brandHighlight}>Vendo</AppText>
            </AppText>
          </View>
        ) : (
          <AppText style={styles.screenTitle}>{title}</AppText>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.avatarButton}
        onPress={handleAccountPress}
      >
        <Avatar uri={user?.avatar} name={user?.name || "User"} size={36} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 8,
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
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  avatarButton: {
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

export default TopHeader;