import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with environment variables
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL.trim(),
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  const config = cloudinary.config();
  return Boolean(
    (config.cloud_name && config.api_key && config.api_secret) ||
    process.env.CLOUDINARY_URL
  );
}

/**
 * Extracts Cloudinary public_id from a full secure URL.
 * e.g. "https://res.cloudinary.com/oelbtnhb/image/upload/v1728148920/utoorateazami/products/abc.png"
 * -> "utoorateazami/products/abc"
 */
export function extractPublicId(url) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return null;
  }
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Deletes an image from Cloudinary using its URL or public ID.
 */
export async function deleteCloudinaryImage(urlOrPublicId) {
  if (!urlOrPublicId || !isCloudinaryConfigured()) return false;
  try {
    const publicId = urlOrPublicId.includes("res.cloudinary.com")
      ? extractPublicId(urlOrPublicId)
      : urlOrPublicId;

    if (!publicId) return false;

    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === "ok";
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
    return false;
  }
}

export default cloudinary;
