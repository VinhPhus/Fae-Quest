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
