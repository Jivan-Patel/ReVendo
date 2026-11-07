import client from "./client";

const listingsEndpoint = "/listings";

const getListings = (params) => client.get(listingsEndpoint, params);

const getMyListings = () => client.get("/my/listings");

const updateListing = (id, listingData) => {
  const data = new FormData();

  if (listingData.title) data.append("title", listingData.title);
  if (listingData.price !== undefined)
    data.append("price", listingData.price.toString());
  if (listingData.description !== undefined)
    data.append("description", listingData.description);
  if (listingData.categoryId)
    data.append("categoryId", listingData.categoryId.toString());
  if (listingData.condition) data.append("condition", listingData.condition);

  if (listingData.existingImages !== undefined) {
    data.append("existingImages", JSON.stringify(listingData.existingImages));
  }

  if (listingData.newImages && listingData.newImages.length > 0) {
    listingData.newImages.forEach((imgUri, index) => {
      data.append("images", {
        name: `image_${Date.now()}_${index}.jpg`,
        type: "image/jpeg",
        uri: imgUri,
      });
    });
  }

  return client.put(`/listings/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

const updateListingStatus = (id, status) =>
  client.patch(`/listings/${id}/status`, { status });

const deleteListing = (id) => client.delete(`/listings/${id}`);

const postListings = (listing, onUploadProgress) => {
  const data = new FormData();

  data.append("title", listing.title);
  data.append("price", listing.price);
  data.append("categoryId", listing.category.value);
  if (listing.condition) data.append("condition", listing.condition);
  data.append("description", listing.description);

  listing.images.forEach((image, index) =>
    data.append("images", {
      name: "image" + index,
      type: "image/jpeg",
      uri: image,
    })
  );

  if (listing.location)
    data.append("location", JSON.stringify(listing.location));

  return client.post(listingsEndpoint, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progress) => {
      if (onUploadProgress) {
        onUploadProgress(progress.loaded / progress.total);
      }
    },
  });
};

export default {
  getListings,
  getMyListings,
  updateListing,
  updateListingStatus,
  deleteListing,
  postListings,
};
