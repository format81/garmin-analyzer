'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ActivityRecord } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface HeartRateChartProps {
  records: ActivityRecord[];
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
}

export function HeartRateChart({ records, avgHeartRate, maxHeartRate }: HeartRateChartProps) {
  const data = useMemo(() => {
    // Sample data to avoid rendering too many points
    const sampleRate = Math.max(1, Math.floor(records.length / 500));
    return records
      .filter((_, i) => i % sampleRate === 0)
      .filter(r => r.heartRate !== null)
      .map((r, i) => ({
        time: i * sampleRate,
        hr: r.heartRate,
      }));
  }, [records]);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400">
        Nessun dato HR disponibile
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-medium text-slate-300 mb-4">Frequenza Cardiaca</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={(v) => formatTime(v)}
            stroke="#475569"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            stroke="#475569"
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelFormatter={(v) => `Tempo: ${formatTime(v as number)}`}
            formatter={(v: number) => [`${v} bpm`, 'FC']}
          />
          {avgHeartRate && (
            <ReferenceLine
              y={avgHeartRate}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: 'Media', fill: '#3b82f6', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="hr"
            stroke="#ef4444"
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PaceChartProps {
  records: ActivityRecord[];
  avgPace?: number | null;
}

export function PaceChart({ records, avgPace }: PaceChartProps) {
  const data = useMemo(() => {
    const sampleRate = Math.max(1, Math.floor(records.length / 500));
    return records
      .filter((_, i) => i % sampleRate === 0)
      .filter(r => r.pace !== null && r.pace > 0 && r.pace < 1200) // Filter unrealistic values
      .map((r, i) => ({
        time: i * sampleRate,
        pace: r.pace,
      }));
  }, [records]);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400">
        Nessun dato passo disponibile
      </div>
    );
  }

  const formatPaceAxis = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chart-container">
      <h3 className="text-sm font-medium text-slate-300 mb-4">Passo</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={(v) => formatTime(v)}
            stroke="#475569"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={formatPaceAxis}
            stroke="#475569"
            width={50}
            reversed
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelFormatter={(v) => `Tempo: ${formatTime(v as number)}`}
            formatter={(v: number) => [formatPaceAxis(v) + '/km', 'Passo']}
          />
          {avgPace && (
            <ReferenceLine
              y={avgPace}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: 'Media', fill: '#3b82f6', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="pace"
            stroke="#22c55e"
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface CadenceChartProps {
  records: ActivityRecord[];
  avgCadence?: number | null;
}

export function CadenceChart({ records, avgCadence }: CadenceChartProps) {
  const data = useMemo(() => {
    const sampleRate = Math.max(1, Math.floor(records.length / 500));
    return records
      .filter((_, i) => i % sampleRate === 0)
      .filter(r => r.cadence !== null && r.cadence > 0)
      .map((r, i) => ({
        time: i * sampleRate,
        cadence: r.cadence,
      }));
  }, [records]);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400">
        Nessun dato cadenza disponibile
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-sm font-medium text-slate-300 mb-4">Cadenza</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={(v) => formatTime(v)}
            stroke="#475569"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            stroke="#475569"
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelFormatter={(v) => `Tempo: ${formatTime(v as number)}`}
            formatter={(v: number) => [`${v} spm`, 'Cadenza']}
          />
          {avgCadence && (
            <ReferenceLine
              y={avgCadence}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: 'Media', fill: '#3b82f6', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="cadence"
            stroke="#a855f7"
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
