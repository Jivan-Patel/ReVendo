import client from "./client";

const createOffer = (data) => client.post("/offers", data);

const getReceivedOffers = () => client.get("/offers/received");

const getSentOffers = () => client.get("/offers/sent");

const respondToOffer = (id, responseData) =>
  client.patch(`/offers/${id}/respond`, responseData);

const buyerRespond = (id, responseData) =>
  client.patch(`/offers/${id}/buyer-respond`, responseData);

export default {
  createOffer,
  getReceivedOffers,
  getSentOffers,
  respondToOffer,
  buyerRespond,
};
