import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AppText from "./AppText";
import colors from "../config/colors";
import { resolveImageUrl } from "../api/client";
import { getConditionMeta } from "../config/conditions";

function Card({
  title,
  subTitle,
  imageUrl,
  onPress,
  numberOfLines = 2,
  thumbnailUrl,
  isFavorite = false,
  onToggleFavorite,
  distance,
  condition,
}) {
  const resolvedUrl = resolveImageUrl(imageUrl);
  const resolvedThumb = resolveImageUrl(thumbnailUrl);
  const conditionMeta = condition ? getConditionMeta(condition) : null;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.background}>
        <View style={styles.cardContainer}>
          <View style={styles.imageWrapper}>
            <Image
              style={styles.image}
              source={{ uri: resolvedUrl }}
              placeholder={{ uri: resolvedThumb }}
              contentFit="cover"
              transition={300}
            />
            {conditionMeta && (
              <View
                style={[
                  styles.conditionBadge,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={conditionMeta.icon}
                  size={13}
                  color={conditionMeta.color}
                  style={{ marginRight: 4 }}
                />
                <AppText
                  style={[styles.conditionText, { color: conditionMeta.color }]}
                >
                  {conditionMeta.label}
                </AppText>
              </View>
            )}
            {onToggleFavorite && (
              <TouchableOpacity
                style={styles.heartButton}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
              >
                <MaterialCommunityIcons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={isFavorite ? colors.primary : colors.medium}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.detailsContainer}>
            <AppText numberOfLines={numberOfLines} style={styles.title}>
              {title}
            </AppText>
            <View style={styles.priceRow}>
              <AppText numberOfLines={numberOfLines} style={styles.subTitle}>
                {subTitle}
              </AppText>
              {distance !== undefined && distance !== null && (
                <View style={styles.distanceBadge}>
                  <MaterialCommunityIcons
                    name="map-marker-distance"
                    size={14}
                    color={colors.primary}
                    style={{ marginRight: 3 }}
                  />
                  <AppText style={styles.distanceText}>{distance} km</AppText>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  image: {
    height: 200,
    width: "100%",
  },
  heartButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  conditionBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailsContainer: {
    fontWeight: "bold",
    padding: 15,
  },
  title: {
    marginBottom: 5,
    fontWeight: "bold",
  },
  subTitle: {
    color: colors.secondary,
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
});

export default Card;
