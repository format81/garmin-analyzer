'use client';

import { DashboardStats } from '@/lib/types';
import { formatTime, formatPace, formatHeartRate } from '@/lib/utils';
import { Activity, Clock, Flame, Heart, TrendingUp, Footprints } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Activity,
      label: 'Attività',
      value: stats.totalActivities.toString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Footprints,
      label: 'Distanza Totale',
      value: `${stats.totalDistance.toFixed(1)} km`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Clock,
      label: 'Tempo Totale',
      value: `${stats.totalTime.toFixed(1)} h`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Flame,
      label: 'Calorie',
      value: stats.totalCalories.toLocaleString(),
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Heart,
      label: 'FC Media',
      value: stats.avgHeartRate ? `${Math.round(stats.avgHeartRate)} bpm` : '--',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Passo Medio',
      value: stats.avgPace ? formatPace(stats.avgPace) : '--',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="stat-card animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center mb-3`}>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
