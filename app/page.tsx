'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import DropZone from '@/components/Upload/DropZone';
import ProgressBar from '@/components/Upload/ProgressBar';
import { useFileProcessor } from '@/components/Upload/FileProcessor';
import SessionButtons from '@/components/Session/SessionButtons';
import { FileInfo } from '@/lib/types';
import { getActivities } from '@/lib/storage';

export default function Home() {
  const router = useRouter();
  const { uploadState, processFiles, resetState } = useFileProcessor();
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    const activities = getActivities();
    setHasExistingData(activities.length > 0);
  }, []);

  const handleFilesSelected = useCallback(async (files: FileInfo[]) => {
    const result = await processFiles(files);
    
    if (result.activities.length > 0 || result.wellness.length > 0) {
      // Wait a bit to show success state, then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  }, [processFiles, router]);

  const handleSessionLoaded = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleGoToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Garmin Analyzer
            </h1>
            <p className="text-slate-400">
              Analisi avanzata dei tuoi dati di allenamento
            </p>
          </div>

          {/* Main Card */}
          <div className="card space-y-6">
            {/* Upload Zone */}
            <DropZone
              onFilesSelected={handleFilesSelected}
              isProcessing={uploadState.status === 'processing'}
            />

            {/* Progress */}
            <ProgressBar state={uploadState} />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">oppure</span>
              </div>
            </div>

            {/* Session Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SessionButtons onSessionLoaded={handleSessionLoaded} />
            </div>

            {/* Go to Dashboard if data exists */}
            {hasExistingData && uploadState.status === 'idle' && (
              <button
                onClick={handleGoToDashboard}
                className="btn btn-primary w-full"
              >
                Vai alla Dashboard →
              </button>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-slate-400">Statistiche avanzate</div>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm text-slate-400">Privacy totale</div>
            </div>
            <div className="p-4">
              <div className="text-2xl mb-2">📱</div>
              <div className="text-sm text-slate-400">PWA installabile</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              Come esportare i dati da Garmin Connect:
            </h3>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
              <li>Vai su connect.garmin.com</li>
              <li>Impostazioni → Gestisci i tuoi dati → Esporta dati</li>
              <li>Riceverai un email con il link per scaricare lo ZIP</li>
              <li>Carica lo ZIP qui sopra</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
        I tuoi dati restano nel browser. Nulla viene salvato sui nostri server.
      </footer>
    </div>
  );
}
