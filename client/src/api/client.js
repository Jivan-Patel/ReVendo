import { create } from "apisauce";
import Constants from "expo-constants";
import authStorage from "../auth/storage";

export const getBaseUrl = () => {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:9000/api`;
  }
  return "http://localhost:9000/api";
};

export const resolveImageUrl = (url) => {
  if (!url) return null;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) {
    if (url.includes("localhost:9000")) {
      return url.replace("localhost:9000", `${host}:9000`);
    }
    if (url.includes("127.0.0.1:9000")) {
      return url.replace("127.0.0.1:9000", `${host}:9000`);
    }
  }
  return url;
};

const apiClient = create({
  baseURL: getBaseUrl(),
});

apiClient.addAsyncRequestTransform(async (request) => {
  const authToken = await authStorage.getToken();
  if (!authToken) return;
  request.headers["x-auth-token"] = authToken;
});

export default apiClient;
