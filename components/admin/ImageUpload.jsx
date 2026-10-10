"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";

export default function ImageUpload({
  value,
  onChange,
  label = "Upload Image",
  folder = "utoorateazami",
  required = false,
  aspect = "square", // 'square' | 'video' | 'banner'
  className = "",
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error & file input
    setError("");

    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB size limit.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      if (value && value.includes("res.cloudinary.com")) {
        formData.append("previousUrl", value);
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image to Cloudinary.");
      }

      if (data.url) {
        onChange(data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed. Please check Cloudinary configuration.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    const oldUrl = value;
    onChange("");
    setError("");

    if (oldUrl && oldUrl.includes("res.cloudinary.com")) {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: oldUrl }),
        });
      } catch (err) {
        console.warn("Could not delete from Cloudinary:", err);
      }
    }
  };

  const aspectClass =
    aspect === "banner"
      ? "aspect-[21/9] max-h-36"
      : aspect === "video"
      ? "aspect-[16/9] max-h-40"
      : "aspect-square max-h-48 max-w-48";

  const isCloudinary = value && value.includes("res.cloudinary.com");

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block font-semibold text-slate-700 text-xs">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {isCloudinary && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Cloudinary CDN</span>
            </span>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Box / Preview */}
      {value ? (
        <div className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs">
          <div className={`w-full ${aspectClass} overflow-hidden bg-slate-100 flex items-center justify-center`}>
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>

          {/* Action overlay buttons */}
          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-xs font-semibold hover:bg-white shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-700" />
              <span>Change Image</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 shadow-xs transition cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Remove 'X' on top right */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition shadow-xs z-10 cursor-pointer"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Empty Dropzone Button */
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center min-h-[140px] group ${
            uploading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 text-slate-800 animate-spin" />
              <span className="text-xs font-semibold text-slate-700">Uploading to Cloudinary...</span>
              <span className="text-[11px] text-slate-400">Optimizing format & resolution</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-slate-200/80 flex items-center justify-center text-slate-600 group-hover:text-slate-900 mb-2 transition">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Click to Upload Image
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, WEBP up to 5MB (Saves to Cloudinary)
              </p>
            </>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-[11px] text-rose-600 flex items-start gap-1.5 mt-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
