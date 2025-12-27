'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Layout/Header';
import StatsCards from '@/components/Dashboard/StatsCards';
import ActivityList from '@/components/Dashboard/ActivityList';
import SessionButtons from '@/components/Session/SessionButtons';
import { Activity, DashboardStats } from '@/lib/types';
import { getActivities, clearSession } from '@/lib/storage';
import { calculateDashboardStats, getRecentActivities } from '@/lib/metrics';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    const storedActivities = getActivities();
    setActivities(storedActivities);
    
    if (storedActivities.length > 0) {
      setStats(calculateDashboardStats(storedActivities));
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearData = useCallback(() => {
    if (confirm('Sei sicuro di voler cancellare tutti i dati?')) {
      clearSession();
      router.push('/');
    }
  }, [router]);

  const handleSessionLoaded = useCallback(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Caricamento...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <p className="text-slate-400 mb-4">Nessun dato trovato</p>
            <Link href="/" className="btn btn-primary">
              Carica i tuoi dati
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <Header>
        <SessionButtons onSessionLoaded={handleSessionLoaded} />
        <Link href="/" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Aggiungi</span>
        </Link>
        <button
          onClick={handleClearData}
          className="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title="Cancella dati"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Activity Distribution */}
        {stats && Object.keys(stats.activitiesByType).length > 0 && (
          <div className="card">
            <h2 className="text-lg font-medium text-slate-200 mb-4">
              Distribuzione attività
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.activitiesByType).map(([sport, count]) => (
                <div
                  key={sport}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg"
                >
                  <span className="text-lg">
                    {sport === 'running' && '🏃'}
                    {sport === 'cycling' && '🚴'}
                    {sport === 'swimming' && '🏊'}
                    {sport === 'walking' && '🚶'}
                    {sport === 'other' && '🏋️'}
                  </span>
                  <span className="text-slate-200 font-medium">{count}</span>
                  <span className="text-slate-400 text-sm capitalize">{sport}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-200">
              Attività recenti
            </h2>
            {activities.length > 10 && (
              <span className="text-sm text-slate-400">
                Mostrando 10 di {activities.length}
              </span>
            )}
          </div>
          <ActivityList
            activities={getRecentActivities(activities, 10)}
            showViewAll={activities.length > 10}
          />
        </div>
      </main>
    </div>
  );
}
