/**
 * Date utilities for local calendar dates in YYYY-MM-DD format.
 * Prevents UTC timezone drift issues by strictly using local device time.
 */

export const getLocalDateStr = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateString = getLocalDateStr;

/**
 * Chuyển mọi mốc thời gian (Date, ISO string, timestamp) sang YYYY-MM-DD theo múi giờ địa phương.
 */
export const toLocalDateKey = (dateInput: Date | string | number): string => {
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? '' : getLocalDateStr(parsed);
  }
  const parsed = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return Number.isNaN(parsed.getTime()) ? '' : getLocalDateStr(parsed);
};

/**
 * Trả về mốc 00:00:00.000 theo giờ địa phương của ngày cách hiện tại `daysAgo` ngày.
 */
export const getLocalStartOfDay = (daysAgo = 0): Date => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getTodayString = (): string => {
  return getLocalDateStr(new Date());
};

export const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateStr(d);
};

export const getTomorrowString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return getLocalDateStr(d);
};

/**
 * Returns true if the given date string is today or unset (defaults to today).
 */
export const isTodayDate = (dateStr?: string): boolean => {
  if (!dateStr) return true;
  return dateStr <= getTodayString();
};

/**
 * Returns true if the given date string is tomorrow or future.
 */
export const isTomorrowOrFutureDate = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return dateStr > getTodayString();
};
