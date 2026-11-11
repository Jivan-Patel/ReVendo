import React, { createContext, useContext, useState, useEffect } from "react";
import wishlistApi from "../api/wishlist";
import AuthContext from "../auth/context";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const loadFavorites = async () => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }
    try {
      const response = await wishlistApi.getWishlistIds();
      if (response.ok && Array.isArray(response.data)) {
        setFavoriteIds(response.data);
      }
    } catch (e) {
      console.log("Error loading wishlist IDs", e);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const isFavorite = (listingId) => {
    if (!listingId) return false;
    return favoriteIds.includes(listingId.toString());
  };

  const toggleFavorite = async (listingId) => {
    if (!user) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const idStr = listingId.toString();
    const currentlyFav = favoriteIds.includes(idStr);

    // Optimistic UI update
    setFavoriteIds((prev) =>
      currentlyFav ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );

    try {
      const res = await wishlistApi.toggleWishlist(idStr);
      if (!res.ok) {
        // Rollback if request failed
        setFavoriteIds((prev) =>
          currentlyFav ? [...prev, idStr] : prev.filter((id) => id !== idStr)
        );
      }
    } catch (e) {
      console.log("Error toggling favorite", e);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        favoriteIds,
        wishlistIds: favoriteIds,
        isFavorite,
        toggleFavorite,
        refreshFavorites: loadFavorites,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);

export default WishlistContext;
