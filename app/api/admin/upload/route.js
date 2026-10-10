import { NextResponse } from "next/server";
import cloudinary, { isCloudinaryConfigured, deleteCloudinaryImage } from "@/lib/cloudinary";

// POST /api/admin/upload - Upload file to Cloudinary & optionally delete old image
export async function POST(request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "utoorateazami";
    const previousUrl = formData.get("previousUrl");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64 Data URI
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ],
    });

    // If an old image was passed and it's on Cloudinary, delete it
    if (previousUrl && previousUrl.includes("res.cloudinary.com")) {
      deleteCloudinaryImage(previousUrl).catch((delErr) => {
        console.warn("Could not delete old image from Cloudinary:", delErr.message);
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/upload - Explicitly delete image from Cloudinary
export async function DELETE(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    if (url.includes("res.cloudinary.com")) {
      await deleteCloudinaryImage(url);
    }

    return NextResponse.json({ success: true, message: "Image deleted from Cloudinary" });
  } catch (err) {
    console.error("Delete image error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
