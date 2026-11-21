import { Homework } from '@/types';

/**
 * Parses various date formats to a timestamp (milliseconds at 00:00:00 local time)
 * Supports:
 * - DD/MM/YYYY (e.g. "21/11/2026", "21/11/2026 00:00:00")
 * - YYYY-MM-DD (e.g. "2026-11-21")
 * - Relative terms: "Hier", "Aujourd'hui", "Demain", "Bientôt"
 */
export function parseDueDateToTimestamp(dueDate: string): number | null {
  if (!dueDate) return null;
  const trimmed = dueDate.trim();
  const lower = trimmed.toLowerCase();

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (lower.includes('hier')) {
    return todayMidnight - 86400000;
  }
  if (lower.includes('aujourd')) {
    return todayMidnight;
  }
  if (lower.includes('demain')) {
    return todayMidnight + 86400000;
  }
  if (lower.includes('bientôt') || lower.includes('bientot')) {
    return todayMidnight;
  }

  // DD/MM/YYYY
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    return new Date(year, month, day).getTime();
  }

  // YYYY-MM-DD
  const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    return new Date(year, month, day).getTime();
  }

  return null;
}

/**
 * Returns true if a homework's due date is strictly before today (00:00:00).
 */
export function isBeforeToday(dueDate: string): boolean {
  if (!dueDate) return false;
  const lower = dueDate.trim().toLowerCase();

  if (lower.includes('hier')) return true;
  if (lower.includes('aujourd') || lower.includes('demain') || lower.includes('bientôt') || lower.includes('bientot')) {
    return false;
  }

  const ts = parseDueDateToTimestamp(dueDate);
  if (ts === null) return false;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return ts < todayMidnight;
}

/**
 * Sorts homework chronologically:
 * - Upcoming homework first (closest due date to furthest)
 * - Past homework afterwards
 */
export function sortHomeworkByDueDate(list: Homework[]): Homework[] {
  return [...list].sort((a, b) => {
    const aPast = isBeforeToday(a.dueDate);
    const bPast = isBeforeToday(b.dueDate);

    // Upcoming before past
    if (!aPast && bPast) return -1;
    if (aPast && !bPast) return 1;

    const now = new Date();
    const defaultFuture = new Date(now.getFullYear() + 1, 0, 1).getTime();
    const aTs = parseDueDateToTimestamp(a.dueDate) ?? defaultFuture;
    const bTs = parseDueDateToTimestamp(b.dueDate) ?? defaultFuture;

    return aTs - bTs;
  });
}
