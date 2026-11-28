export const DEFAULT_HUNTER_NAME = 'Thợ Săn Fae';
export const MIN_HUNTER_NAME_LENGTH = 2;
export const MAX_HUNTER_NAME_LENGTH = 20;

export function collapseHunterNameSpaces(raw?: string | null): string {
  return String(raw ?? '').replace(/\s+/g, ' ').trim();
}

export function validateHunterName(raw: string): {
  valid: boolean;
  cleanName: string;
  error?: string;
} {
  const cleanName = collapseHunterNameSpaces(raw);
  if (cleanName.length < MIN_HUNTER_NAME_LENGTH) {
    return {
      valid: false,
      cleanName,
      error: `Tên Thợ Săn cần tối thiểu ${MIN_HUNTER_NAME_LENGTH} ký tự`,
    };
  }
  if (cleanName.length > MAX_HUNTER_NAME_LENGTH) {
    return {
      valid: false,
      cleanName,
      error: `Tên Thợ Săn tối đa ${MAX_HUNTER_NAME_LENGTH} ký tự`,
    };
  }
  return { valid: true, cleanName };
}

/**
 * Chuẩn hóa tên tài khoản hiện có từ DB/Store.
 * Nếu rỗng, dưới 2 ký tự hoặc vượt quá 20 ký tự -> tự động đưa về tên mặc định "Thợ Săn Fae".
 */
export function normalizeStoredHunterName(raw?: string | null): {
  name: string;
  wasReset: boolean;
  wasOverflow: boolean;
} {
  const cleanName = collapseHunterNameSpaces(raw);
  if (!cleanName || cleanName.length < MIN_HUNTER_NAME_LENGTH) {
    return {
      name: DEFAULT_HUNTER_NAME,
      wasReset: true,
      wasOverflow: false,
    };
  }
  if (cleanName.length > MAX_HUNTER_NAME_LENGTH) {
    return {
      name: DEFAULT_HUNTER_NAME,
      wasReset: true,
      wasOverflow: true,
    };
  }
  return {
    name: cleanName,
    wasReset: false,
    wasOverflow: false,
  };
}
