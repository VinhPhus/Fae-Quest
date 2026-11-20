import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../constants/cloudinary';
import { compressImage } from './imageCompression';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/**
 * Tải ảnh trực tiếp lên Cloudinary sử dụng Unsigned Upload Preset
 * Tự động nén qua HTML5 Canvas (max width 1280px, WebP quality 0.8) để tiết kiệm 8x dung lượng
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  // 1. Tự động nén ảnh client-side trước khi upload
  const processedFile = await compressImage(file, 1280, 0.8);

  // 2. Chuẩn bị FormData với unsigned preset
  const formData = new FormData();
  formData.append('file', processedFile);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi tải ảnh lên kho lưu trữ (${response.status})`);
  }

  const data = await response.json();
  return data.secure_url || data.url;
};
