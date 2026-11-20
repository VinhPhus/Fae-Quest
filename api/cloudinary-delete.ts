import crypto from 'crypto';

/**
 * Trích xuất chính xác public_id từ URL Cloudinary
 * Xử lý: bỏ domain, /image/upload/, các biến thể transform (c_scale...), version (v123456/) và đuôi mở rộng (.jpg/.png/.webp)
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com')) return null;

  try {
    const parts = url.split(/\/image\/upload\//);
    if (parts.length < 2) return null;

    let rest = parts[1];
    // Bỏ query string hoặc hash nếu có
    rest = rest.split('?')[0].split('#')[0];

    const segments = rest.split('/');
    const cleanedSegments: string[] = [];
    let pastPrefix = false;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (!pastPrefix) {
        // Bỏ version v123456789
        if (/^v\d+$/.test(seg)) {
          pastPrefix = true;
          continue;
        }
        // Bỏ transformation như c_fill,w_300 hoặc f_auto
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
 * Xóa một ảnh trên Cloudinary qua REST API sử dụng chữ ký SHA-1 an toàn
 */
async function destroyCloudinaryImage(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  publicId: string
): Promise<{ publicId: string; status: 'ok' | 'not_found' | 'error'; message?: string }> {
  const timestamp = Math.floor(Date.now() / 1000);

  // Tạo chuỗi ký tự chuẩn theo thứ tự alphabet: public_id=${publicId}&timestamp=${timestamp}${apiSecret}
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  const formData = new URLSearchParams();
  formData.append('public_id', publicId);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (data.result === 'ok') {
      return { publicId, status: 'ok' };
    } else if (data.result === 'not found') {
      return { publicId, status: 'not_found', message: 'Ảnh không tồn tại hoặc đã được xóa' };
    } else {
      return { publicId, status: 'error', message: data.error?.message || data.result || 'Lỗi không xác định' };
    }
  } catch (err: any) {
    return { publicId, status: 'error', message: err?.message || 'Lỗi kết nối Cloudinary' };
  }
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
    return;
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.VITE_CLOUDINARY_CLOUD_NAME ||
    'dngxkcqv2';
  const apiKey =
    process.env.CLOUDINARY_API_KEY ||
    process.env.VITE_CLOUDINARY_API_KEY ||
    '298548816326162';
  const apiSecret =
    process.env.CLOUDINARY_API_SECRET ||
    process.env.VITE_CLOUDINARY_API_SECRET ||
    'qTwxSwzqzSOEgNbw8MnmCz8wulA';

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(500).json({ error: 'Chưa cấu hình biến môi trường Cloudinary API' });
    return;
  }

  const body = req.body || {};
  const urls: string[] = Array.isArray(body.urls) ? body.urls : [];
  const publicIdsInput: string[] = Array.isArray(body.public_ids) ? body.public_ids : [];

  // Trích xuất toàn bộ public_ids
  const targetPublicIds = new Set<string>();

  for (const pid of publicIdsInput) {
    if (typeof pid === 'string' && pid.trim()) {
      targetPublicIds.add(pid.trim());
    }
  }

  for (const url of urls) {
    if (typeof url === 'string' && url.trim()) {
      const extracted = extractPublicIdFromUrl(url.trim());
      if (extracted) {
        targetPublicIds.add(extracted);
      }
    }
  }

  const listToDelete = Array.from(targetPublicIds);

  if (listToDelete.length === 0) {
    res.status(200).json({
      success: true,
      deletedCount: 0,
      message: 'Không có public_id hoặc ảnh Cloudinary nào hợp lệ cần xóa',
      details: [],
    });
    return;
  }

  // Thực thi xóa song song
  const results = await Promise.all(
    listToDelete.map((pid) => destroyCloudinaryImage(cloudName, apiKey, apiSecret, pid))
  );

  const deletedCount = results.filter((r) => r.status === 'ok' || r.status === 'not_found').length;

  res.status(200).json({
    success: true,
    deletedCount,
    totalRequested: listToDelete.length,
    details: results,
  });
}
