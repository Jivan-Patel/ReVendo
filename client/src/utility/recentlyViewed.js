import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@revendo_recently_viewed";
const MAX_ITEMS = 10;

const getRecentlyViewed = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.log("Error getting recently viewed", e);
    return [];
  }
};

const addRecentlyViewed = async (listing) => {
  if (!listing) return;
  try {
    const list = await getRecentlyViewed();
    const listingId = (listing.id || listing._id || "").toString();

    // Filter out if already in list to move it to the front
    const filtered = list.filter(
      (item) => (item.id || item._id || "").toString() !== listingId
    );

    const updated = [listing, ...filtered].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch (e) {
    console.log("Error saving recently viewed", e);
  }
};

const clearRecentlyViewed = async () => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.log("Error clearing recently viewed", e);
  }
};

export default {
  getRecentlyViewed,
  addRecentlyViewed,
  clearRecentlyViewed,
};
