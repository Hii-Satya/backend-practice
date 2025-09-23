import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "./ApiError.js";

const extractPublicId = (url) => {
  try {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL");
    }

    const parts = url.split("/");
    const fileWithExt = parts.pop(); // "myimage.jpg"
    const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf(".")); // "myimage"

    const folderPath = parts.slice(parts.indexOf("upload") + 1).join("/");
    return folderPath ? `${folderPath}/${publicId}` : publicId;
  } catch (err) {
    console.error("Error extracting public_id:", err);
    return null;
  }
};
const removeCloudinaryFile = async (url, resource_type) => {
   try {
    if (!url) {
      console.warn("⚠️ Skipping Cloudinary deletion: no URL provided");
      return null;
    }

    const publicId = extractPublicId(url) || url; // handle both URL & public_id
    if (!publicId) {
      // console.warn("⚠️ Skipping Cloudinary deletion: invalid URL", url);
      return null;
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resource_type || "image",
    });

    return response;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    throw new ApiError(
      500,
      "Something went wrong while removing old image from Cloudinary"
    );
  }
};

export { removeCloudinaryFile };
