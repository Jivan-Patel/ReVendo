import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import ListItem from "../components/ListItem";
import Avatar from "../components/Avatar";
import AppText from "../components/AppText";
import colors from "../config/colors";
import Icon from "../components/Icon";
import ListItemSeparator from "../components/ListItemSeparator";
import routes from "../navigation/routes";
import useAuth from "../auth/useAuth";
import { useWishlist } from "../context/WishlistContext";

const TABS = [
  { id: "overview", label: "Overview", icon: "view-dashboard-outline" },
  { id: "listings", label: "Listings", icon: "format-list-bulleted" },
  { id: "offers", label: "Offers", icon: "tag-multiple" },
  { id: "wishlist", label: "Wishlist", icon: "heart-outline" },
];

function AccountScreen({ navigation }) {
  const { user, logOut } = useAuth();
  const wishlistContext = useWishlist();
  const wishlistCount =
    wishlistContext?.favoriteIds?.length ||
    wishlistContext?.wishlistIds?.length ||
    0;
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            uri={user?.avatar}
            name={user?.name || "User"}
            size={80}
            style={styles.avatar}
          />
          <AppText style={styles.userName}>{user?.name || "Account"}</AppText>
          <AppText style={styles.userEmail}>{user?.email || ""}</AppText>

          <TouchableOpacity
            style={styles.editProfileBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(routes.EDIT_PROFILE)}
          >
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <AppText style={styles.editProfileText}>Edit Profile</AppText>
          </TouchableOpacity>
        </View>

        {/* Top Segmented Navigation Tabs */}
        <View style={styles.topTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={16}
                    color={isActive ? colors.white : colors.medium}
                    style={{ marginRight: 6 }}
                  />
                  <AppText
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  >
                    {tab.label}
                    {tab.id === "wishlist" && wishlistCount > 0
                      ? ` (${wishlistCount})`
                      : ""}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate(routes.MY_LISTINGS)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIconBox, { backgroundColor: "#EBF5FF" }]}
                >
                  <MaterialCommunityIcons
                    name="format-list-bulleted"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <AppText style={styles.statLabel}>My Listings</AppText>
                <AppText style={styles.statSub}>Manage items</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate(routes.OFFERS)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIconBox, { backgroundColor: "#F3E8FF" }]}
                >
                  <MaterialCommunityIcons
                    name="tag-multiple"
                    size={22}
                    color={colors.secondary}
                  />
                </View>
                <AppText style={styles.statLabel}>Offers</AppText>
                <AppText style={styles.statSub}>Negotiations</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate(routes.WISHLIST)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.statIconBox, { backgroundColor: "#FEE2E2" }]}
                >
                  <MaterialCommunityIcons
                    name="heart"
                    size={22}
                    color={colors.danger}
                  />
                </View>
                <AppText style={styles.statLabel}>Wishlist</AppText>
                <AppText style={styles.statSub}>
                  {wishlistCount} saved
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Menu List */}
            <View style={styles.menuContainer}>
              <ListItem
                title="My Messages"
                IconComponent={
                  <Icon name="email" backgroundColor={colors.medium} />
                }
                onPress={() => navigation.navigate(routes.MESSAGES)}
              />
              <ListItemSeparator />
              <ListItem
                title="Edit Profile"
                IconComponent={
                  <Icon name="account-edit" backgroundColor="#3B82F6" />
                }
                onPress={() => navigation.navigate(routes.EDIT_PROFILE)}
              />
            </View>

            <View style={styles.logoutContainer}>
              <ListItem
                title="Log Out"
                IconComponent={
                  <Icon name="logout" backgroundColor={colors.yellow} />
                }
                onPress={() => logOut()}
              />
            </View>
          </View>
        )}

        {/* Tab 2: My Listings */}
        {activeTab === "listings" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionCard}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={42}
                color={colors.primary}
                style={{ marginBottom: 12 }}
              />
              <AppText style={styles.sectionTitle}>Manage Your Listings</AppText>
              <AppText style={styles.sectionSubtitle}>
                View, edit price & details, toggle between Active and Sold, or
                delete items you have listed.
              </AppText>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(routes.MY_LISTINGS)}
              >
                <AppText style={styles.primaryActionBtnText}>
                  Go to My Listings
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(routes.LISTING_EDIT)}
              >
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <AppText style={styles.secondaryActionBtnText}>
                  Post New Listing
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 3: My Offers */}
        {activeTab === "offers" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionCard}>
              <MaterialCommunityIcons
                name="handshake-outline"
                size={42}
                color={colors.secondary}
                style={{ marginBottom: 12 }}
              />
              <AppText style={styles.sectionTitle}>Price Negotiations</AppText>
              <AppText style={styles.sectionSubtitle}>
                Review offers from buyers on your listings, send counter-offers,
                and track the offers you have sent to other sellers.
              </AppText>

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: colors.secondary },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(routes.OFFERS)}
              >
                <AppText style={styles.primaryActionBtnText}>
                  View All Offers
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 4: Wishlist */}
        {activeTab === "wishlist" && (
          <View style={styles.tabContent}>
            <View style={styles.sectionCard}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={42}
                color={colors.danger}
                style={{ marginBottom: 12 }}
              />
              <AppText style={styles.sectionTitle}>Saved Favorites</AppText>
              <AppText style={styles.sectionSubtitle}>
                You have {wishlistCount} saved item
                {wishlistCount === 1 ? "" : "s"} in your wishlist.
              </AppText>

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  { backgroundColor: colors.danger },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(routes.WISHLIST)}
              >
                <AppText style={styles.primaryActionBtnText}>
                  Open Wishlist
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.light,
    flex: 1,
  },
  profileHeader: {
    backgroundColor: colors.white,
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatar: {
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark,
  },
  userEmail: {
    fontSize: 14,
    color: colors.medium,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  editProfileText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  topTabsContainer: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabsRow: {
    paddingHorizontal: 15,
    gap: 8,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.medium,
  },
  tabLabelActive: {
    color: colors.white,
  },
  tabContent: {
    padding: 15,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.dark,
    textAlign: "center",
  },
  statSub: {
    fontSize: 11,
    color: colors.medium,
    marginTop: 2,
    textAlign: "center",
  },
  menuContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  logoutContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    marginBottom: 30,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.medium,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryActionBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  secondaryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryActionBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default AccountScreen;