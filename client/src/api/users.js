import client from "../api/client";

const register = (userInfo) => {
  return client.post("/users", userInfo);
};

const getProfile = () => {
  return client.get("/users/me");
};

const updateProfile = (profileData, onUploadProgress) => {
  const data = new FormData();

  if (profileData.name) data.append("name", profileData.name);
  if (profileData.bio !== undefined) data.append("bio", profileData.bio);
  if (profileData.phone !== undefined) data.append("phone", profileData.phone);
  if (profileData.password) data.append("password", profileData.password);
  if (profileData.removeAvatar) data.append("removeAvatar", "true");

  if (profileData.avatarUri) {
    data.append("avatar", {
      name: "avatar.jpg",
      type: "image/jpeg",
      uri: profileData.avatarUri,
    });
  }

  return client.put("/users/profile", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progress) => {
      if (onUploadProgress && progress.total) {
        onUploadProgress(progress.loaded / progress.total);
      }
    },
  });
};

export default {
  register,
  getProfile,
  updateProfile,
};
