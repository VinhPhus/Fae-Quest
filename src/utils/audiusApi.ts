export interface AudiusTrackResult {
  id: string;
  title: string;
  artist: string;
  duration: number;
  artworkUrl: string | null;
  streamUrl: string;
  isStreamable: boolean;
}

let cachedAudiusHost: string | null = null;

/**
 * Lấy discovery host nhanh nhất từ Audius API Gateway
 */
export async function getAudiusHost(): Promise<string> {
  if (cachedAudiusHost) return cachedAudiusHost;
  try {
    const res = await fetch('https://api.audius.co');
    const json = await res.json();
    if (Array.isArray(json.data) && json.data.length > 0) {
      cachedAudiusHost = json.data[0];
      return cachedAudiusHost!;
    }
  } catch (err) {
    console.warn('Không thể phân giải host Audius, sử dụng fallback:', err);
  }
  cachedAudiusHost = 'https://api.audius.co';
  return cachedAudiusHost;
}

/**
 * Tìm kiếm bài hát miễn phí, trọn vẹn bản quyền trên Audius Public API
 */
export async function searchAudiusTracks(query: string): Promise<AudiusTrackResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  try {
    const host = await getAudiusHost();
    const url = `${host}/v1/tracks/search?query=${encodeURIComponent(clean)}&app_name=FaeQuest`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Audius API returned status ${res.status}`);

    const json = await res.json();
    const items = json.data || [];

    return items
      .filter((item: any) => item.is_streamable !== false && item.id)
      .map((item: any) => {
        const id = String(item.id);
        const artworkUrl =
          item.artwork?.['150x150'] ||
          item.artwork?.['480x480'] ||
          item.artwork?.['1000x1000'] ||
          null;
        const streamUrl = `${host}/v1/tracks/${id}/stream?app_name=FaeQuest`;

        return {
          id,
          title: item.title || 'Untitled Track',
          artist: item.user?.name || item.user?.handle || 'Unknown Artist',
          duration: item.duration || 180,
          artworkUrl,
          streamUrl,
          isStreamable: item.is_streamable !== false,
        };
      });
  } catch (err) {
    console.error('Lỗi tìm kiếm Audius tracks:', err);
    return [];
  }
}

/**
 * Trích xuất YouTube Video ID từ link bất kỳ
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

/**
 * Lấy metadata tiêu đề & thumbnail từ YouTube qua noembed / fallback
 */
export async function fetchYouTubeMetadata(
  url: string,
  videoId: string
): Promise<{ title: string; artist: string; thumbnail: string }> {
  const defaultThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  let title = 'YouTube Track';
  let artist = 'YouTube Music';
  let thumbnail = defaultThumb;

  try {
    const endpoint = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.title && !data.title.startsWith('http')) {
        title = data.title;
      }
      if (data.author_name) {
        artist = data.author_name;
      }
      if (data.thumbnail_url) {
        thumbnail = data.thumbnail_url;
      }
    }
  } catch {
    // Giữ giá trị fallback
  }

  return { title, artist, thumbnail };
}
