'use client';

import { UploadState } from '@/lib/types';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  state: UploadState;
}

export default function ProgressBar({ state }: ProgressBarProps) {
  if (state.status === 'idle') {
    return null;
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Status Header */}
      <div className="flex items-center gap-2">
        {state.status === 'processing' && (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        )}
        {state.status === 'success' && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
        {state.status === 'error' && (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        <span className="text-sm font-medium text-slate-200">
          {state.status === 'processing' && 'Elaborazione in corso...'}
          {state.status === 'success' && 'Elaborazione completata'}
          {state.status === 'error' && 'Elaborazione completata con errori'}
        </span>
      </div>

      {/* Progress Bar */}
      {state.status === 'processing' && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}

      {/* Current File */}
      {state.currentFile && (
        <p className="text-xs text-slate-400">
          {state.currentFile}
        </p>
      )}

      {/* Stats */}
      {(state.status === 'success' || state.status === 'error') && (
        <p className="text-sm text-slate-400">
          Elaborati {state.processedFiles} di {state.totalFiles} file
        </p>
      )}

      {/* Errors */}
      {state.errors.length > 0 && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm font-medium text-red-400 mb-1">
            Errori ({state.errors.length}):
          </p>
          <ul className="text-xs text-red-300 space-y-1 max-h-24 overflow-y-auto">
            {state.errors.slice(0, 5).map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
            {state.errors.length > 5 && (
              <li>... e altri {state.errors.length - 5} errori</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
