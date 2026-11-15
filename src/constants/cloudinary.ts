/**
 * Cấu hình tích hợp Cloudinary cho tải ảnh đại diện Thợ Săn FaeQuest
 * Đọc tự động từ file biến môi trường .env (Vite prefix: VITE_CLOUDINARY_*)
 */

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dngxkcqv2';

export const CLOUDINARY_API_KEY =
  import.meta.env.VITE_CLOUDINARY_API_KEY || '298548816326162';

export const CLOUDINARY_API_SECRET =
  import.meta.env.VITE_CLOUDINARY_API_SECRET || 'qTwxSwzqzSOEgNbw8MnmCz8wulA';

// Tên Upload Preset dạng Unsigned trên Cloudinary (mặc định: faequest_avatars)
export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'faequest_avatars';

// Đường dẫn REST API upload trực tiếp từ trình duyệt
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
