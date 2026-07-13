import { uploadPresigned } from "@vercel/blob/client";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2400;
const COMPRESS_FROM_BYTES = 2.5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PreparedImage = { file: File; ratio: number };

function cleanName(name: string) {
  const stem = name.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return (stem || "memory").slice(0, 60);
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("无法压缩这张图片")),
    "image/webp",
    .86,
  ));
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!ACCEPTED_TYPES.has(file.type)) throw new Error("只支持 JPG、PNG 或 WebP 图片");
  if (file.size > MAX_FILE_BYTES) throw new Error("单张图片不能超过 20 MB");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const ratio = bitmap.width / bitmap.height;
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= COMPRESS_FROM_BYTES) {
    bitmap.close();
    return { file, ratio };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("浏览器无法处理这张图片");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await canvasBlob(canvas);
  return { file: new File([blob], `${cleanName(file.name)}.webp`, { type: "image/webp" }), ratio };
}

export async function uploadImage(file: File, folder: "tickets" | "photos") {
  const prepared = await prepareImage(file);
  const extension = prepared.file.type === "image/png" ? "png" : prepared.file.type === "image/jpeg" ? "jpg" : "webp";
  const blob = await uploadPresigned(`memory-waypoints/uploads/${folder}/${Date.now()}-${cleanName(prepared.file.name)}.${extension}`, prepared.file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload",
  });
  return { url: blob.url, ratio: prepared.ratio };
}
