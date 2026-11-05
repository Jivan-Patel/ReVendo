import React from "react";
import { View, Image, StyleSheet, TouchableHighlight } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import AppText from "./AppText";
import Avatar from "./Avatar";
import colors from "../config/colors";

function ListItem({
  title,
  titleLines = 1, //TODO: testing
  subTitle,
  subTitleLines = 2, //TODO: testing
  image,
  avatarUri,
  AvatarComponent,
  IconComponent,
  onPress,
  renderRightActions,
  showChevrons = true,
}) {
  //GestureHandlerRootView was moved to App.js.
  // This caused an error as the ListItem component was not shown on the screen.
  const renderAvatarGraphic = () => {
    if (IconComponent) return IconComponent;
    if (AvatarComponent) return AvatarComponent;
    if (avatarUri) {
      return <Avatar uri={avatarUri} name={title} size={64} />;
    }
    if (image) {
      return <Image style={styles.image} source={image} />;
    }
    if (title) {
      return <Avatar name={title} size={64} />;
    }
    return null;
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableHighlight underlayColor={colors.light} onPress={onPress}>
        <View style={styles.container}>
          {renderAvatarGraphic()}
          <View style={styles.detailsContainer}>
            <AppText numberOfLines={titleLines} style={styles.title}>
              {title}
            </AppText>
            {subTitle && (
              <AppText numberOfLines={subTitleLines} style={styles.subTitle}>
                {subTitle}
              </AppText>
            )}
          </View>
          {showChevrons && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={25}
              color={colors.medium}
            ></MaterialCommunityIcons>
          )}
        </View>
      </TouchableHighlight>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    padding: 15,
    backgroundColor: colors.white,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  subTitle: {
    color: colors.medium,
  },
  title: {
    fontWeight: "500",
  },
});

export default ListItem;
