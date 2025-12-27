// Format time in seconds to HH:MM:SS or MM:SS
export function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '--';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format pace (sec/km) to M:SS/km
export function formatPace(secPerKm: number | null): string {
  if (secPerKm === null || secPerKm === undefined || secPerKm === 0) return '--';
  
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

// Format distance in meters to km
export function formatDistance(meters: number | null): string {
  if (meters === null || meters === undefined) return '--';
  
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)}m`;
  }
  return `${km.toFixed(2)}km`;
}

// Format distance short (no unit)
export function formatDistanceShort(meters: number | null): string {
  if (meters === null || meters === undefined) return '--';
  return (meters / 1000).toFixed(1);
}

// Format speed (m/s) to km/h
export function formatSpeed(mps: number | null): string {
  if (mps === null || mps === undefined) return '--';
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

// Format date to locale string
export function formatDate(dateString: string | null): string {
  if (!dateString) return '--';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

// Format date short
export function formatDateShort(dateString: string | null): string {
  if (!dateString) return '--';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return '--';
  }
}

// Format datetime
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '--';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
}

// Format calories
export function formatCalories(calories: number | null): string {
  if (calories === null || calories === undefined) return '--';
  return `${Math.round(calories)} kcal`;
}

// Format heart rate
export function formatHeartRate(hr: number | null): string {
  if (hr === null || hr === undefined) return '--';
  return `${Math.round(hr)} bpm`;
}

// Format cadence
export function formatCadence(cadence: number | null): string {
  if (cadence === null || cadence === undefined) return '--';
  return `${Math.round(cadence)} spm`;
}

// Format elevation
export function formatElevation(meters: number | null): string {
  if (meters === null || meters === undefined) return '--';
  return `${Math.round(meters)}m`;
}

// Get sport icon
export function getSportIcon(sport: string): string {
  switch (sport) {
    case 'running':
      return '🏃';
    case 'cycling':
      return '🚴';
    case 'swimming':
      return '🏊';
    case 'walking':
      return '🚶';
    default:
      return '🏋️';
  }
}

// Get sport label
export function getSportLabel(sport: string): string {
  switch (sport) {
    case 'running':
      return 'Corsa';
    case 'cycling':
      return 'Ciclismo';
    case 'swimming':
      return 'Nuoto';
    case 'walking':
      return 'Camminata';
    default:
      return 'Altro';
  }
}

// Calculate week number
export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

// Generate unique ID from content
export async function generateId(content: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Color for heart rate zones
export function getHRZoneColor(hr: number, maxHR: number = 190): string {
  const percentage = (hr / maxHR) * 100;
  
  if (percentage < 60) return '#3b82f6'; // Blue - Zone 1
  if (percentage < 70) return '#22c55e'; // Green - Zone 2
  if (percentage < 80) return '#eab308'; // Yellow - Zone 3
  if (percentage < 90) return '#f97316'; // Orange - Zone 4
  return '#ef4444'; // Red - Zone 5
}

// Color for pace (running)
export function getPaceColor(secPerKm: number): string {
  if (secPerKm > 420) return '#3b82f6';  // > 7:00 - Easy
  if (secPerKm > 360) return '#22c55e';  // 6:00-7:00 - Moderate
  if (secPerKm > 300) return '#eab308';  // 5:00-6:00 - Tempo
  if (secPerKm > 240) return '#f97316';  // 4:00-5:00 - Threshold
  return '#ef4444';                       // < 4:00 - Speed
}
