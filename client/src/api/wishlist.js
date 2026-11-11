import client from "./client";

const getWishlist = () => client.get("/wishlist");

const getWishlistIds = () => client.get("/wishlist/ids");

const toggleWishlist = (listingId) =>
  client.post(`/wishlist/toggle/${listingId}`);

export default {
  getWishlist,
  getWishlistIds,
  toggleWishlist,
};
