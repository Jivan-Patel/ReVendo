import React from "react";
import { StyleSheet, ImageBackground, View, Image } from "react-native";

import colors from "../config/colors";
import AppText from "../components/AppText";
import AppButton from "../components/AppButton";
import routes from "../navigation/routes";

function WelcomeScreen({ navigation }) {
  return (
    <ImageBackground
      style={styles.background}
      blurRadius={5}
      source={require("../assets/background.jpg")}
    >
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          source={require("../assets/test_logo.png")}
        />
        <AppText style={styles.brandTitle}>
          Re<AppText style={styles.brandHighlight}>Vendo</AppText>
        </AppText>
        <AppText style={styles.tagline}>
          Best overall marketplace identity.
        </AppText>
      </View>
      <View style={styles.buttonsContainer}>
        <AppButton
          title="Login"
          onPress={() => navigation.navigate(routes.LOGIN)}
        />
        <AppButton
          title="Register"
          backgroundColor={"secondary"}
          onPress={() => navigation.navigate(routes.REGISTER)}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    top: 70,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    height: 100,
    width: 100,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.dark,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandHighlight: {
    color: colors.primary,
    fontWeight: "900",
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.medium,
    textAlign: "center",
  },
  buttonsContainer: {
    padding: 20,
    width: "100%",
  },
});

export default WelcomeScreen;
