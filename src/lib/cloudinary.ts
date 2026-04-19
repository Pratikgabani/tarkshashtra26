import { randomUUID } from "crypto";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const ASSIGNMENT_UPLOAD_FOLDER = "shikshasetu/assignment-briefs";

let isConfigured = false;

function configureFromCloudinaryUrl(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (!cloudinaryUrl) return false;

  try {
    const parsed = new URL(cloudinaryUrl);
    const cloudName = parsed.hostname;
    const apiKey = decodeURIComponent(parsed.username || "");
    const apiSecret = decodeURIComponent(parsed.password || "");

    if (parsed.protocol !== "cloudinary:" || !cloudName || !apiKey || !apiSecret) {
      return false;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    return true;
  } catch {
    return false;
  }
}

function ensureConfigured() {
  if (isConfigured) {
    return;
  }

  if (configureFromCloudinaryUrl()) {
    isConfigured = true;
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  isConfigured = true;
}

function sanitizeFileBaseName(fileName: string): string {
  const parsed = path.parse(fileName);
  const safe = parsed.name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);

  return safe || "assignment";
}

function inferExtension(fileName: string, mimeType?: string): string {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".pdf") {
    return extension;
  }

  if (mimeType === "application/pdf") return ".pdf";

  return ".pdf";
}

export interface AssignmentFileUploadInput {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
  teacherId: string;
}

export interface AssignmentFileUploadResult {
  secureUrl: string;
  publicId: string;
}

export async function uploadAssignmentFileToCloudinary(
  input: AssignmentFileUploadInput
): Promise<AssignmentFileUploadResult> {
  ensureConfigured();

  const safeBaseName = sanitizeFileBaseName(input.fileName);
  const extension = inferExtension(input.fileName, input.mimeType);
  const publicId = `${input.teacherId}_${Date.now()}_${randomUUID()}_${safeBaseName}`;
  const effectiveFileName = `${safeBaseName}${extension}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: ASSIGNMENT_UPLOAD_FOLDER,
        public_id: publicId,
        resource_type: "raw",
        filename_override: effectiveFileName,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(input.buffer);
  });
}

export async function deleteRawFileFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) return;

  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.warn("Cloudinary cleanup failed:", error);
  }
}
