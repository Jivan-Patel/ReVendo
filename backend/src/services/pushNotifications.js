const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendPushNotification = async (targetExpoPushToken, message) => {
  if (!Expo.isExpoPushToken(targetExpoPushToken)) {
    console.error(`Push token ${targetExpoPushToken} is not a valid Expo push token`);
    return false;
  }

  const messages = [
    {
      to: targetExpoPushToken,
      sound: "default",
      body: message,
      data: { message },
    },
  ];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Push ticket sent:", ticketChunk);
    }
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

module.exports = { sendPushNotification };
