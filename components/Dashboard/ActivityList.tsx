'use client';

import Link from 'next/link';
import { Activity } from '@/lib/types';
import { formatDate, formatTime, formatDistance, formatPace, formatHeartRate, getSportIcon, getSportLabel } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  limit?: number;
  showViewAll?: boolean;
}

export default function ActivityList({ activities, limit, showViewAll = false }: ActivityListProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <p>Nessuna attività trovata</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => (
        <Link
          key={activity.id}
          href={`/activities/${activity.id}`}
          className="activity-item animate-fade-in"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          {/* Sport Icon */}
          <div className="text-2xl">
            {getSportIcon(activity.sport)}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-200 truncate">
                {activity.name || getSportLabel(activity.sport)}
              </span>
              <span className="badge badge-blue">
                {getSportLabel(activity.sport)}
              </span>
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {formatDate(activity.startTime)}
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-right">
              <div className="font-medium text-slate-200">
                {formatDistance(activity.totalDistance)}
              </div>
              <div className="text-slate-400">Distanza</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-slate-200">
                {formatTime(activity.totalTime)}
              </div>
              <div className="text-slate-400">Tempo</div>
            </div>
            {activity.sport === 'running' && activity.avgPace && (
              <div className="text-right">
                <div className="font-medium text-slate-200">
                  {formatPace(activity.avgPace)}
                </div>
                <div className="text-slate-400">Passo</div>
              </div>
            )}
            {activity.avgHeartRate && (
              <div className="text-right">
                <div className="font-medium text-slate-200">
                  {Math.round(activity.avgHeartRate)} bpm
                </div>
                <div className="text-slate-400">FC</div>
              </div>
            )}
          </div>

          {/* Mobile Stats */}
          <div className="sm:hidden text-right text-sm">
            <div className="font-medium text-slate-200">
              {formatDistance(activity.totalDistance)}
            </div>
            <div className="text-slate-400">
              {formatTime(activity.totalTime)}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </Link>
      ))}

      {/* View All Link */}
      {showViewAll && activities.length > (limit || 0) && (
        <div className="text-center pt-2">
          <Link
            href="/activities"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Vedi tutte le {activities.length} attività →
          </Link>
        </div>
      )}
    </div>
  );
}
