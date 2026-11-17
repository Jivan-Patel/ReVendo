import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import ListItem from "../components/ListItem";
import ListItemSeparator from "../components/ListItemSeparator";
import ActivityIndicator from "../components/ActivityIndicator";
import AppText from "../components/AppText";
import TopHeader from "../components/TopHeader";
import colors from "../config/colors";
import messagesApi from "../api/messages";
import routes from "../navigation/routes";

function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messagesApi.getConversations();
      if (res.ok) {
        setConversations(res.data || []);
      }
    } catch (e) {
      console.log("Error loading conversations:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConversations();
    const unsubscribe = navigation.addListener("focus", loadConversations);
    return unsubscribe;
  }, [navigation]);

  return (
    <Screen style={styles.screen}>
      <TopHeader title="My Messages" navigation={navigation} />
      <ActivityIndicator visible={loading} />

      {conversations.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="chat-processing-outline"
            size={64}
            color={colors.medium}
          />
          <AppText style={styles.emptyTitle}>No Conversations Yet</AppText>
          <AppText style={styles.emptySubtitle}>
            When buyers or sellers message you about a listing, your chats will
            appear here.
          </AppText>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ListItemSeparator}
        refreshing={loading}
        onRefresh={loadConversations}
        renderItem={({ item }) => (
          <ListItem
            title={item.otherUser?.name || "User"}
            titleLines={1}
            subTitle={`${item.listing?.title ? item.listing.title + ": " : ""}${item.lastMessage}`}
            subTitleLines={2}
            avatarUri={item.otherUser?.avatar}
            showChevrons={true}
            onPress={() =>
              navigation.navigate(routes.CHAT, {
                listing: item.listing,
                otherUser: item.otherUser,
              })
            }
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.light,
    flex: 1,
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.medium,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
});

export default MessagesScreen;
