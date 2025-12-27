import { Activity, WellnessDay, DashboardStats, WeeklyData } from './types';
import { getWeekNumber } from './utils';

// Calculate dashboard stats from activities
export function calculateDashboardStats(activities: Activity[]): DashboardStats {
  if (activities.length === 0) {
    return {
      totalActivities: 0,
      totalDistance: 0,
      totalTime: 0,
      totalCalories: 0,
      avgHeartRate: null,
      avgPace: null,
      activitiesByType: {},
      weeklyDistance: [],
      weeklyTime: [],
    };
  }

  // Basic totals
  const totalDistance = activities.reduce((sum, a) => sum + (a.totalDistance || 0), 0) / 1000; // to km
  const totalTime = activities.reduce((sum, a) => sum + (a.totalTime || 0), 0) / 3600; // to hours
  const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);

  // Average HR (only from activities with HR data)
  const hrActivities = activities.filter(a => a.avgHeartRate !== null);
  const avgHeartRate = hrActivities.length > 0
    ? hrActivities.reduce((sum, a) => sum + (a.avgHeartRate || 0), 0) / hrActivities.length
    : null;

  // Average pace (only from running activities)
  const runningActivities = activities.filter(a => a.sport === 'running' && a.avgPace !== null);
  const avgPace = runningActivities.length > 0
    ? runningActivities.reduce((sum, a) => sum + (a.avgPace || 0), 0) / runningActivities.length
    : null;

  // Activities by type
  const activitiesByType: Record<string, number> = {};
  for (const activity of activities) {
    activitiesByType[activity.sport] = (activitiesByType[activity.sport] || 0) + 1;
  }

  // Weekly aggregations
  const weeklyDistance = calculateWeeklyData(activities, 'distance');
  const weeklyTime = calculateWeeklyData(activities, 'time');

  return {
    totalActivities: activities.length,
    totalDistance,
    totalTime,
    totalCalories,
    avgHeartRate,
    avgPace,
    activitiesByType,
    weeklyDistance,
    weeklyTime,
  };
}

// Calculate weekly aggregated data
function calculateWeeklyData(
  activities: Activity[],
  metric: 'distance' | 'time'
): WeeklyData[] {
  const weeklyMap = new Map<string, number>();

  for (const activity of activities) {
    const week = getWeekNumber(new Date(activity.startTime));
    const current = weeklyMap.get(week) || 0;

    if (metric === 'distance') {
      weeklyMap.set(week, current + (activity.totalDistance || 0) / 1000);
    } else {
      weeklyMap.set(week, current + (activity.totalTime || 0) / 3600);
    }
  }

  // Sort by week and return last 12 weeks
  return Array.from(weeklyMap.entries())
    .map(([week, value]) => ({ week, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12);
}

// Calculate running-specific stats
export function calculateRunningStats(activities: Activity[]) {
  const runs = activities.filter(a => a.sport === 'running');
  
  if (runs.length === 0) {
    return null;
  }

  // Categorize runs
  const easyRuns = runs.filter(a => {
    const pace = a.avgPace || 0;
    return pace > 360; // Slower than 6:00/km
  });

  const tempoRuns = runs.filter(a => {
    const pace = a.avgPace || 0;
    return pace >= 300 && pace <= 360; // 5:00-6:00/km
  });

  const speedRuns = runs.filter(a => {
    const pace = a.avgPace || 0;
    return pace < 300; // Faster than 5:00/km
  });

  // Calculate totals
  const totalKm = runs.reduce((sum, a) => sum + (a.totalDistance || 0), 0) / 1000;
  const totalHours = runs.reduce((sum, a) => sum + (a.totalTime || 0), 0) / 3600;

  // Average paces by category
  const avgEasyPace = easyRuns.length > 0
    ? easyRuns.reduce((sum, a) => sum + (a.avgPace || 0), 0) / easyRuns.length
    : null;

  const avgTempoPace = tempoRuns.length > 0
    ? tempoRuns.reduce((sum, a) => sum + (a.avgPace || 0), 0) / tempoRuns.length
    : null;

  // Cadence stats
  const cadenceRuns = runs.filter(a => a.avgCadence !== null);
  const avgCadence = cadenceRuns.length > 0
    ? cadenceRuns.reduce((sum, a) => sum + (a.avgCadence || 0), 0) / cadenceRuns.length
    : null;

  return {
    totalRuns: runs.length,
    totalKm,
    totalHours,
    easyRunsCount: easyRuns.length,
    tempoRunsCount: tempoRuns.length,
    speedRunsCount: speedRuns.length,
    avgEasyPace,
    avgTempoPace,
    avgCadence,
    easyPercentage: (easyRuns.length / runs.length) * 100,
  };
}

// Get recent activities (last N)
export function getRecentActivities(activities: Activity[], count: number = 10): Activity[] {
  return [...activities]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, count);
}

// Filter activities by date range
export function filterActivitiesByDateRange(
  activities: Activity[],
  startDate: Date,
  endDate: Date
): Activity[] {
  return activities.filter(a => {
    const activityDate = new Date(a.startTime);
    return activityDate >= startDate && activityDate <= endDate;
  });
}

// Filter activities by sport
export function filterActivitiesBySport(
  activities: Activity[],
  sport: string
): Activity[] {
  return activities.filter(a => a.sport === sport);
}

// Get personal bests
export function getPersonalBests(activities: Activity[]) {
  const runs = activities.filter(a => a.sport === 'running');
  
  // Fastest 5K
  const around5k = runs.filter(a => {
    const dist = a.totalDistance || 0;
    return dist >= 4800 && dist <= 5200;
  });
  const fastest5k = around5k.length > 0
    ? around5k.reduce((best, a) => (a.avgPace || Infinity) < (best.avgPace || Infinity) ? a : best)
    : null;

  // Fastest 10K
  const around10k = runs.filter(a => {
    const dist = a.totalDistance || 0;
    return dist >= 9800 && dist <= 10200;
  });
  const fastest10k = around10k.length > 0
    ? around10k.reduce((best, a) => (a.avgPace || Infinity) < (best.avgPace || Infinity) ? a : best)
    : null;

  // Longest run
  const longestRun = runs.length > 0
    ? runs.reduce((best, a) => (a.totalDistance || 0) > (best.totalDistance || 0) ? a : best)
    : null;

  // Highest elevation gain
  const mostElevation = runs.length > 0
    ? runs.reduce((best, a) => (a.totalAscent || 0) > (best.totalAscent || 0) ? a : best)
    : null;

  return {
    fastest5k,
    fastest10k,
    longestRun,
    mostElevation,
  };
}
