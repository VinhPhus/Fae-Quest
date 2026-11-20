/**
 * Tiện ích nén ảnh client-side bằng HTML5 Canvas trước khi tải lên Cloudinary
 * - Tự động thu nhỏ chiều rộng tối đa về 1280px (giữ nguyên tỷ lệ khung hình)
 * - Xuất ra định dạng image/webp (chất lượng 0.8) để tối ưu dung lượng (200KB - 400KB)
 * - Tăng gấp 8 lần sức chứa lưu trữ mà vẫn giữ độ nét cao trên mọi thiết bị
 */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  quality = 0.8
): Promise<File> {
  // Nếu không phải là ảnh raster (SVG, GIF, v.v.), giữ nguyên file gốc
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Nếu ảnh nhỏ hơn maxWidth và file đã nhẹ (< 400KB), giữ nguyên
        if (width <= maxWidth && file.size < 400 * 1024 && file.type === 'image/webp') {
          resolve(file);
          return;
        }

        // Tính tỷ lệ thu nhỏ nếu width > maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Khử răng cưa và làm mịn nét chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất ra định dạng webp (nếu browser hỗ trợ) hoặc jpeg
        const targetType = 'image/webp';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Đổi đuôi tên file thành .webp
            const baseName =
              file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const compressedFile = new File([blob], `${baseName}.webp`, {
              type: targetType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          targetType,
          quality
        );
      };

      img.onerror = () => {
        resolve(file);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
