import client from "./client";

const getMessages = () => client.get("/messages");

const getConversations = () => client.get("/messages/conversations");

const getThread = (listingId, otherUserId) =>
  client.get(`/messages/thread/${listingId}/${otherUserId}`);

const send = (message, listingId, toUserId) =>
  client.post("/messages", {
    message,
    listingId,
    toUserId,
  });

export default {
  getMessages,
  getConversations,
  getThread,
  send,
};
