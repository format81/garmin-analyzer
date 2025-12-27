// Activity record - singolo data point (secondo per secondo)
export interface ActivityRecord {
  timestamp: string;
  heartRate: number | null;
  speed: number | null;        // m/s
  pace: number | null;         // sec/km
  cadence: number | null;
  distance: number;            // metri cumulativi
  altitude: number | null;
  lat: number | null;
  lon: number | null;
  power: number | null;
  groundContactTime: number | null;
  verticalOscillation: number | null;
}

// Activity - singola attività parsata
export interface Activity {
  id: string;
  filename: string;
  sport: 'running' | 'cycling' | 'swimming' | 'walking' | 'other';
  name: string;
  startTime: string;
  endTime: string;
  totalTime: number;           // secondi
  movingTime: number;          // secondi
  totalDistance: number;       // metri
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  minHeartRate: number | null;
  avgPace: number | null;      // sec/km
  maxPace: number | null;      // sec/km (fastest)
  avgSpeed: number | null;     // m/s
  maxSpeed: number | null;     // m/s
  avgCadence: number | null;
  maxCadence: number | null;
  totalAscent: number | null;
  totalDescent: number | null;
  calories: number | null;
  avgPower: number | null;
  maxPower: number | null;
  avgGroundContactTime: number | null;
  avgVerticalOscillation: number | null;
  records: ActivityRecord[];
  laps: Lap[];
}

// Lap data
export interface Lap {
  index: number;
  startTime: string;
  totalTime: number | null;
  distance: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPace: number | null;
  avgCadence: number | null;
  calories: number | null;
}

// Wellness giornaliero
export interface WellnessDay {
  date: string;
  stressAvg: number | null;
  stressMax: number | null;
  stressMin: number | null;
  restingHR: number | null;
  hrv: number | null;
  hrvStatus: string | null;
  steps: number | null;
  activeCalories: number | null;
  totalCalories: number | null;
  floorsClimbed: number | null;
  intensityMinutes: number | null;
  bodyBattery: number | null;
  bodyBatteryChange: number | null;
}

// Sleep data
export interface SleepData {
  date: string;
  sleepScore: number | null;
  totalSleepTime: number | null;  // minuti
  deepSleep: number | null;       // minuti
  lightSleep: number | null;      // minuti
  remSleep: number | null;        // minuti
  awakeTime: number | null;       // minuti
  sleepStart: string | null;
  sleepEnd: string | null;
  avgHR: number | null;
  avgHRV: number | null;
  respirationRate: number | null;
  spo2: number | null;
}

// Session completa (per salvataggio)
export interface Session {
  version: string;
  exportedAt: string;
  activities: Activity[];
  wellness: WellnessDay[];
  sleep: SleepData[];
}

// Dashboard stats aggregate
export interface DashboardStats {
  totalActivities: number;
  totalDistance: number;        // km
  totalTime: number;            // ore
  totalCalories: number;
  avgHeartRate: number | null;
  avgPace: number | null;       // sec/km
  activitiesByType: Record<string, number>;
  weeklyDistance: WeeklyData[];
  weeklyTime: WeeklyData[];
}

export interface WeeklyData {
  week: string;
  value: number;
}

// API Response
export interface ParseResponse {
  success: boolean;
  activities: Activity[];
  wellness: WellnessDay[];
  sleep: SleepData[];
  errors: string[];
  warnings: string[];
}

// Upload state
export interface UploadState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  currentFile: string;
  totalFiles: number;
  processedFiles: number;
  errors: string[];
}

// File info per upload
export interface FileInfo {
  name: string;
  size: number;
  type: 'fit' | 'zip' | 'unknown';
  content?: ArrayBuffer;
}
