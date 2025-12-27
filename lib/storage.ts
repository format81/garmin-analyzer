import { Activity, WellnessDay, SleepData, Session } from './types';

const STORAGE_KEYS = {
  ACTIVITIES: 'garmin_activities',
  WELLNESS: 'garmin_wellness',
  SLEEP: 'garmin_sleep',
  SESSION_ID: 'garmin_session_id',
} as const;

const SESSION_VERSION = '1.0.0';

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Generate unique session ID
export function getSessionId(): string {
  if (!isBrowser) return '';
  
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

// Activities
export function getActivities(): Activity[] {
  if (!isBrowser) return [];
  
  const data = sessionStorage.getItem(STORAGE_KEYS.ACTIVITIES);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function setActivities(activities: Activity[]): void {
  if (!isBrowser) return;
  sessionStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

export function addActivities(newActivities: Activity[]): Activity[] {
  const existing = getActivities();
  const existingIds = new Set(existing.map(a => a.id));
  
  // Filter out duplicates
  const uniqueNew = newActivities.filter(a => !existingIds.has(a.id));
  const merged = [...existing, ...uniqueNew];
  
  // Sort by date descending
  merged.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  setActivities(merged);
  return merged;
}

export function getActivityById(id: string): Activity | null {
  const activities = getActivities();
  return activities.find(a => a.id === id) || null;
}

// Wellness
export function getWellness(): WellnessDay[] {
  if (!isBrowser) return [];
  
  const data = sessionStorage.getItem(STORAGE_KEYS.WELLNESS);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function setWellness(wellness: WellnessDay[]): void {
  if (!isBrowser) return;
  sessionStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(wellness));
}

export function addWellness(newWellness: WellnessDay[]): WellnessDay[] {
  const existing = getWellness();
  const existingDates = new Set(existing.map(w => w.date));
  
  // Merge, preferring newer data
  const merged = [...existing];
  for (const w of newWellness) {
    const existingIndex = merged.findIndex(e => e.date === w.date);
    if (existingIndex >= 0) {
      merged[existingIndex] = w; // Replace with newer
    } else {
      merged.push(w);
    }
  }
  
  // Sort by date descending
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  setWellness(merged);
  return merged;
}

// Sleep
export function getSleep(): SleepData[] {
  if (!isBrowser) return [];
  
  const data = sessionStorage.getItem(STORAGE_KEYS.SLEEP);
  if (!data) return [];
  
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function setSleep(sleep: SleepData[]): void {
  if (!isBrowser) return;
  sessionStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(sleep));
}

export function addSleep(newSleep: SleepData[]): SleepData[] {
  const existing = getSleep();
  const existingDates = new Set(existing.map(s => s.date));
  
  const merged = [...existing];
  for (const s of newSleep) {
    const existingIndex = merged.findIndex(e => e.date === s.date);
    if (existingIndex >= 0) {
      merged[existingIndex] = s;
    } else {
      merged.push(s);
    }
  }
  
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  setSleep(merged);
  return merged;
}

// Session export/import
export function exportSession(): Session {
  return {
    version: SESSION_VERSION,
    exportedAt: new Date().toISOString(),
    activities: getActivities(),
    wellness: getWellness(),
    sleep: getSleep(),
  };
}

export function importSession(session: Session): { success: boolean; error?: string } {
  try {
    if (!session.version) {
      return { success: false, error: 'Invalid session file: missing version' };
    }
    
    if (session.activities) {
      setActivities(session.activities);
    }
    if (session.wellness) {
      setWellness(session.wellness);
    }
    if (session.sleep) {
      setSleep(session.sleep);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: `Import failed: ${error}` };
  }
}

export function downloadSessionAsFile(): void {
  const session = exportSession();
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `garmin-session-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clearSession(): void {
  if (!isBrowser) return;
  
  sessionStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
  sessionStorage.removeItem(STORAGE_KEYS.WELLNESS);
  sessionStorage.removeItem(STORAGE_KEYS.SLEEP);
}

// Storage size info
export function getStorageInfo(): { used: number; available: number } {
  if (!isBrowser) return { used: 0, available: 0 };
  
  let used = 0;
  for (const key of Object.values(STORAGE_KEYS)) {
    const item = sessionStorage.getItem(key);
    if (item) {
      used += item.length * 2; // UTF-16
    }
  }
  
  // sessionStorage is typically 5-10MB
  const available = 5 * 1024 * 1024; // 5MB estimate
  
  return { used, available };
}
