import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_URL_PREFIX = "/api/v1/avatars/";
const AVATAR_FILE_RE = /^[a-f0-9]{32}\.webp$/;

export const UPLOAD_ROOT = process.env.UPLOAD_DIR || "/app/uploads";
export const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");

// Identify the image by its leading bytes, never by the client-supplied type or extension (USR-02).
export function detectImageType(buf: Buffer): "jpeg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export function isAvatarFileName(name: string): boolean {
  return AVATAR_FILE_RE.test(name);
}

// Re-encodes to a 256x256 WebP (drops EXIF and any other metadata) under a random name.
// Returns the URL path to store in user.avatarPath.
export async function saveAvatar(input: Buffer): Promise<string> {
  const output = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();

  await fs.mkdir(AVATAR_DIR, { recursive: true });
  const fileName = `${crypto.randomBytes(16).toString("hex")}.webp`;
  await fs.writeFile(path.join(AVATAR_DIR, fileName), output, { mode: 0o644 });
  return `${AVATAR_URL_PREFIX}${fileName}`;
}

// Best effort: a leftover file is harmless, a failed request is not.
export async function deleteAvatarFile(avatarPath: string | null | undefined): Promise<void> {
  if (!avatarPath || !avatarPath.startsWith(AVATAR_URL_PREFIX)) return;
  const fileName = avatarPath.slice(AVATAR_URL_PREFIX.length);
  if (!isAvatarFileName(fileName)) return;
  try {
    await fs.unlink(path.join(AVATAR_DIR, fileName));
  } catch {
    /* already gone */
  }
}
