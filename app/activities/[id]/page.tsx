'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Layout/Header';
import { HeartRateChart, PaceChart, CadenceChart } from '@/components/Charts/ActivityCharts';
import { Activity, Lap } from '@/lib/types';
import { getActivityById } from '@/lib/storage';
import {
  formatTime,
  formatDistance,
  formatPace,
  formatDate,
  formatDateTime,
  formatCalories,
  formatElevation,
  getSportIcon,
  getSportLabel,
} from '@/lib/utils';
import {
  Clock,
  Footprints,
  Heart,
  TrendingUp,
  Flame,
  Mountain,
  Activity as ActivityIcon,
} from 'lucide-react';

export default function ActivityDetail() {
  const params = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string;
    const found = getActivityById(id);
    setActivity(found);
    setIsLoading(false);
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Caricamento...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen">
        <Header showBackButton title="Attività non trovata" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16 text-slate-400">
            Attività non trovata
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <Header showBackButton title={activity.name || getSportLabel(activity.sport)} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Card */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="text-4xl">
              {getSportIcon(activity.sport)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                {activity.name || getSportLabel(activity.sport)}
              </h1>
              <p className="text-slate-400 mt-1">
                {formatDateTime(activity.startTime)}
              </p>
              <div className="badge badge-blue mt-2">
                {getSportLabel(activity.sport)}
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={Footprints}
            label="Distanza"
            value={formatDistance(activity.totalDistance)}
            color="text-green-400"
          />
          <StatCard
            icon={Clock}
            label="Tempo"
            value={formatTime(activity.totalTime)}
            color="text-purple-400"
          />
          {activity.sport === 'running' && (
            <StatCard
              icon={TrendingUp}
              label="Passo Medio"
              value={formatPace(activity.avgPace)}
              color="text-cyan-400"
            />
          )}
          <StatCard
            icon={Heart}
            label="FC Media"
            value={activity.avgHeartRate ? `${Math.round(activity.avgHeartRate)} bpm` : '--'}
            color="text-red-400"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={Heart}
            label="FC Max"
            value={activity.maxHeartRate ? `${Math.round(activity.maxHeartRate)} bpm` : '--'}
            color="text-red-400"
            small
          />
          <StatCard
            icon={ActivityIcon}
            label="Cadenza Media"
            value={activity.avgCadence ? `${Math.round(activity.avgCadence)} spm` : '--'}
            color="text-purple-400"
            small
          />
          <StatCard
            icon={Mountain}
            label="Dislivello +"
            value={formatElevation(activity.totalAscent)}
            color="text-amber-400"
            small
          />
          <StatCard
            icon={Flame}
            label="Calorie"
            value={activity.calories ? `${activity.calories}` : '--'}
            color="text-orange-400"
            small
          />
        </div>

        {/* Charts */}
        {activity.records && activity.records.length > 0 && (
          <div className="space-y-4">
            <HeartRateChart
              records={activity.records}
              avgHeartRate={activity.avgHeartRate}
              maxHeartRate={activity.maxHeartRate}
            />
            
            {activity.sport === 'running' && (
              <PaceChart
                records={activity.records}
                avgPace={activity.avgPace}
              />
            )}
            
            <CadenceChart
              records={activity.records}
              avgCadence={activity.avgCadence}
            />
          </div>
        )}

        {/* Laps */}
        {activity.laps && activity.laps.length > 1 && (
          <div className="card">
            <h2 className="text-lg font-medium text-slate-200 mb-4">
              Lap ({activity.laps.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 pr-4">#</th>
                    <th className="text-right py-2 px-4">Distanza</th>
                    <th className="text-right py-2 px-4">Tempo</th>
                    <th className="text-right py-2 px-4">Passo</th>
                    <th className="text-right py-2 px-4">FC Avg</th>
                    <th className="text-right py-2 pl-4">FC Max</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.laps.map((lap) => (
                    <LapRow key={lap.index} lap={lap} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  small?: boolean;
}

function StatCard({ icon: Icon, label, value, color, small }: StatCardProps) {
  return (
    <div className={`stat-card ${small ? 'p-3' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className={`font-bold text-white ${small ? 'text-lg' : 'text-xl'}`}>
        {value}
      </div>
    </div>
  );
}

interface LapRowProps {
  lap: Lap;
}

function LapRow({ lap }: LapRowProps) {
  return (
    <tr className="border-b border-slate-700/50 hover:bg-slate-700/30">
      <td className="py-2 pr-4 text-slate-300">{lap.index}</td>
      <td className="py-2 px-4 text-right text-slate-200">
        {lap.distance ? `${(lap.distance / 1000).toFixed(2)} km` : '--'}
      </td>
      <td className="py-2 px-4 text-right text-slate-200">
        {formatTime(lap.totalTime)}
      </td>
      <td className="py-2 px-4 text-right text-slate-200">
        {formatPace(lap.avgPace)}
      </td>
      <td className="py-2 px-4 text-right text-slate-200">
        {lap.avgHeartRate ? `${lap.avgHeartRate} bpm` : '--'}
      </td>
      <td className="py-2 pl-4 text-right text-slate-200">
        {lap.maxHeartRate ? `${lap.maxHeartRate} bpm` : '--'}
      </td>
    </tr>
  );
}
