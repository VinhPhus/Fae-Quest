/**
 * Tiện ích phía client gọi API xóa ảnh Cloudinary an toàn
 */

export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const parts = url.split(/\/image\/upload\//);
    if (parts.length < 2) return null;

    let rest = parts[1];
    rest = rest.split('?')[0].split('#')[0];

    const segments = rest.split('/');
    const cleanedSegments: string[] = [];
    let pastPrefix = false;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!pastPrefix) {
        if (/^v\d+$/.test(seg)) {
          pastPrefix = true;
          continue;
        }
        if (seg.includes(',') || /^[a-z]_[a-z0-9_]+$/i.test(seg)) {
          continue;
        }
        pastPrefix = true;
      }
      cleanedSegments.push(seg);
    }

    if (cleanedSegments.length === 0) return null;

    const joined = cleanedSegments.join('/');
    const lastDotIndex = joined.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? joined.substring(0, lastDotIndex) : joined;
    return decodeURIComponent(publicId);
  } catch {
    return null;
  }
}

/**
 * Gửi yêu cầu xóa danh sách ảnh lên Serverless Function /api/cloudinary-delete
 */
export async function deleteCloudinaryImages(
  urlsOrPublicIds: string[]
): Promise<{ success: boolean; deletedCount: number }> {
  if (!urlsOrPublicIds || urlsOrPublicIds.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  // Lọc chỉ lấy những URL thực sự thuộc Cloudinary hoặc publicId hợp lệ
  const filtered = urlsOrPublicIds.filter((item) => {
    if (!item || typeof item !== 'string') return false;
    // Bỏ qua data URL (base64) và file local
    if (item.startsWith('data:') || item.startsWith('blob:') || item.startsWith('/')) {
      return false;
    }
    return item.includes('cloudinary.com') || !item.includes('://');
  });

  if (filtered.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  try {
    const res = await fetch('/api/cloudinary-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls: filtered }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Yêu cầu xóa Cloudinary không thành công:', errData);
      return { success: false, deletedCount: 0 };
    }

    const data = await res.json();
    return {
      success: Boolean(data.success),
      deletedCount: data.deletedCount || 0,
    };
  } catch (err) {
    console.warn('Lỗi kết nối khi gọi /api/cloudinary-delete:', err);
    return { success: false, deletedCount: 0 };
  }
}
