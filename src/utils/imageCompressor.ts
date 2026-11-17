/**
 * Tiện ích nén và tối ưu ảnh đại diện thành Data URL kích thước nhỏ gọn
 * Giúp avatar luôn hiển thị ngay lập tức và lưu an toàn vào LocalStorage mà không sợ đầy bộ nhớ
 */
export const compressImageToDataUrl = (file: File, maxSize = 280): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Nén định dạng JPEG chất lượng 86% (~15KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể phân tích dữ liệu ảnh'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh'));
    reader.readAsDataURL(file);
  });
};

/**
 * Tiện ích nén và tối ưu ảnh bìa (Cover Banner) ngang sắc nét chuẩn AAA
 * Hỗ trợ tỉ lệ màn ảnh rộng (lên tới 1400px), giữ chi tiết cảnh quan mà vẫn nhỏ gọn (~70KB)
 */
export const compressCoverImageToDataUrl = (
  file: File,
  maxWidth = 1400,
  maxHeight = 600
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Giữ tỉ lệ gốc, scale vừa vặn khung maxWidth x maxHeight
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Vẽ mượt mà với chất lượng cao
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Nén định dạng JPEG chất lượng 85% (~60KB - 80KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể phân tích dữ liệu ảnh bìa'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh bìa'));
    reader.readAsDataURL(file);
  });
};
