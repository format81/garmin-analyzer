'use client';

import { useCallback, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { downloadSessionAsFile, importSession } from '@/lib/storage';
import { Session } from '@/lib/types';

interface SessionButtonsProps {
  onSessionLoaded?: () => void;
}

export default function SessionButtons({ onSessionLoaded }: SessionButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    downloadSessionAsFile();
  }, []);

  const handleLoadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const session: Session = JSON.parse(text);
      const result = importSession(session);

      if (result.success) {
        onSessionLoaded?.();
        alert('Sessione caricata con successo!');
      } else {
        alert(`Errore: ${result.error}`);
      }
    } catch (error) {
      alert(`Errore nel caricamento del file: ${error}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onSessionLoaded]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSave}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Salva sessione</span>
      </button>

      <button
        onClick={handleLoadClick}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Carica sessione</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
