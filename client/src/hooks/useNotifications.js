import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import expoPushTokensApi from "../api/expoPushTokens";
import Constants from "expo-constants";

const useNotifications = (notificationListener) => {
  useEffect(() => {
    registerForPushNotifications();

    let subscription;
    if (notificationListener) {
      subscription =
        Notifications.addNotificationReceivedListener(notificationListener);
    }

    return () => {
      subscription?.remove();
    };
  }, [notificationListener]);

  const registerForPushNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
      expoPushTokensApi.register(token);
    } catch (error) {
      console.log("Error getting push token", error);
    }
  };
};

export default useNotifications;
