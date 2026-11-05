import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl } from "../api/client";

const AVATAR_PALETTE = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#E11D48", // Rose
];

export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name) => {
  if (!name || typeof name !== "string") return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};

function Avatar({
  name = "User",
  uri = null,
  image = null,
  size = 60,
  style,
  textStyle,
}) {
  const [imageError, setImageError] = useState(false);

  const resolvedUri = uri ? resolveImageUrl(uri) : null;
  const hasImage = Boolean((resolvedUri || image) && !imageError);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (hasImage) {
    return (
      <Image
        style={[containerStyle, style]}
        source={resolvedUri ? { uri: resolvedUri } : image}
        contentFit="cover"
        transition={200}
        onError={() => setImageError(true)}
      />
    );
  }

  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      style={[
        styles.lettersContainer,
        containerStyle,
        { backgroundColor: bgColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.initialsText,
          { fontSize, lineHeight: fontSize * 1.2 },
          textStyle,
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lettersContainer: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initialsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
  },
});

export default Avatar;