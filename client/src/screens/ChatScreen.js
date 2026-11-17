import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";

import Screen from "../components/Screen";
import AppText from "../components/AppText";
import Avatar from "../components/Avatar";
import colors from "../config/colors";
import messagesApi from "../api/messages";
import { resolveImageUrl } from "../api/client";
import useAuth from "../auth/useAuth";
import routes from "../navigation/routes";

function formatMessageTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function ChatScreen({ route, navigation }) {
  const { listing, otherUser } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const listingId = listing.id || listing._id;
  const otherUserId = otherUser.id || otherUser._id;
  const currentUserId = user?.userId || user?._id;

  const loadThread = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await messagesApi.getThread(listingId, otherUserId);
      if (res.ok) {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.log("Error loading thread:", err);
    }
    if (isInitial) setLoading(false);
  };

  useEffect(() => {
    loadThread(true);
    const interval = setInterval(() => {
      loadThread(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [listingId, otherUserId]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setInputText("");
    setSending(true);

    // Optimistic message update
    const tempMsg = {
      _id: Date.now().toString(),
      message: trimmed,
      fromUserId: { _id: currentUserId, name: user?.name, avatar: user?.avatar },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const res = await messagesApi.send(trimmed, listingId, otherUserId);
    setSending(false);

    if (res.ok && res.data) {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMsg._id ? res.data : m))
      );
    }
  };

  const listingThumb =
    listing.images && listing.images.length > 0
      ? resolveImageUrl(listing.images[0].thumbnailUrl || listing.images[0].url)
      : null;

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        {/* Chat Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={30}
              color={colors.dark}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userHeaderInfo}
            activeOpacity={0.8}
            onPress={() => {
              if (otherUserId) {
                navigation.navigate(routes.SELLER_PROFILE, {
                  sellerId: otherUserId,
                });
              }
            }}
          >
            <Avatar
              uri={otherUser.avatar}
              name={otherUser.name || "User"}
              size={40}
            />
            <View style={styles.userTextInfo}>
              <AppText style={styles.userName}>
                {otherUser.name || "User"}
              </AppText>
              <AppText style={styles.onlineStatus}>Online</AppText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Listing Context Banner */}
        <TouchableOpacity
          style={styles.listingBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate(routes.LISTING_DETAILS, listing)}
        >
          {listingThumb && (
            <Image
              style={styles.listingThumb}
              source={{ uri: listingThumb }}
              contentFit="cover"
            />
          )}
          <View style={styles.listingBannerDetails}>
            <AppText numberOfLines={1} style={styles.bannerTitle}>
              {listing.title}
            </AppText>
            <AppText style={styles.bannerPrice}>₹{listing.price}</AppText>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.medium}
          />
        </TouchableOpacity>

        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => (item.id || item._id).toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={48}
                  color={colors.medium}
                />
                <AppText style={styles.emptyText}>
                  No messages yet. Send a message to start the conversation!
                </AppText>
              </View>
            }
            renderItem={({ item }) => {
              const fromId =
                item.fromUserId?._id?.toString() ||
                item.fromUserId?.id?.toString() ||
                item.fromUserId?.toString();
              const isMine = fromId === currentUserId?.toString();

              return (
                <View
                  style={[
                    styles.messageBubbleWrapper,
                    isMine ? styles.myBubbleWrapper : styles.otherBubbleWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.messageText,
                        isMine ? styles.myMessageText : styles.otherMessageText,
                      ]}
                    >
                      {item.message}
                    </AppText>
                    <AppText
                      style={[
                        styles.messageTime,
                        isMine ? styles.myTimeText : styles.otherTimeText,
                      ]}
                    >
                      {formatMessageTime(item.createdAt)}
                    </AppText>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.medium}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            disabled={!inputText.trim() || sending}
            onPress={handleSend}
          >
            <MaterialCommunityIcons
              name="send"
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    marginRight: 10,
  },
  userHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userTextInfo: {
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.dark,
  },
  onlineStatus: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  listingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  listingThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  listingBannerDetails: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
  },
  bannerPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.secondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.medium,
    textAlign: "center",
    marginTop: 10,
  },
  messageBubbleWrapper: {
    marginVertical: 4,
    flexDirection: "row",
  },
  myBubbleWrapper: {
    justifyContent: "flex-end",
  },
  otherBubbleWrapper: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.dark,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myTimeText: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  otherTimeText: {
    color: colors.medium,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.light,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    color: colors.dark,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
});

export default ChatScreen;
