import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../constants/cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/**
 * Tải ảnh trực tiếp lên Cloudinary sử dụng Unsigned Upload Preset
 * Hỗ trợ tạo URL ảnh icon / thành tựu / shop item với độ phân giải cao và CDN cực nhanh
 */
export const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi tải ảnh lên Cloudinary (${response.status})`);
  }

  const data = await response.json();
  return data.secure_url || data.url;
};
