import client from "./client";

const getSellerProfile = (sellerId) =>
  client.get(`/reviews/seller/${sellerId}/profile`);

const getSellerReviews = (sellerId) =>
  client.get(`/reviews/seller/${sellerId}`);

const addReview = (sellerId, reviewData) =>
  client.post(`/reviews/seller/${sellerId}`, reviewData);

export default {
  getSellerProfile,
  getSellerReviews,
  addReview,
};
