'use client';

import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { FileInfo, Activity, WellnessDay, SleepData, UploadState, ParseResponse } from '@/lib/types';
import { addActivities, addWellness, addSleep } from '@/lib/storage';

interface ProcessResult {
  activities: Activity[];
  wellness: WellnessDay[];
  sleep: SleepData[];
  errors: string[];
}

export function useFileProcessor() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    processedFiles: 0,
    errors: [],
  });

  const extractFitFilesFromZip = async (zipContent: ArrayBuffer): Promise<FileInfo[]> => {
    const zip = await JSZip.loadAsync(zipContent);
    const fitFiles: FileInfo[] = [];

    const filePromises: Promise<void>[] = [];

    zip.forEach((relativePath, file) => {
      if (!file.dir && relativePath.toLowerCase().endsWith('.fit')) {
        filePromises.push(
          file.async('arraybuffer').then(content => {
            fitFiles.push({
              name: relativePath.split('/').pop() || relativePath,
              size: content.byteLength,
              type: 'fit',
              content,
            });
          })
        );
      }
    });

    await Promise.all(filePromises);
    return fitFiles;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const processFiles = useCallback(async (files: FileInfo[]): Promise<ProcessResult> => {
    const allActivities: Activity[] = [];
    const allWellness: WellnessDay[] = [];
    const allSleep: SleepData[] = [];
    const allErrors: string[] = [];

    // First, expand any ZIP files
    let fitFiles: FileInfo[] = [];

    setUploadState({
      status: 'processing',
      progress: 0,
      currentFile: 'Estrazione file...',
      totalFiles: files.length,
      processedFiles: 0,
      errors: [],
    });

    for (const file of files) {
      if (file.type === 'zip' && file.content) {
        try {
          const extractedFiles = await extractFitFilesFromZip(file.content);
          fitFiles = [...fitFiles, ...extractedFiles];
        } catch (e) {
          allErrors.push(`Errore estrazione ${file.name}: ${e}`);
        }
      } else if (file.type === 'fit') {
        fitFiles.push(file);
      }
    }

    if (fitFiles.length === 0) {
      setUploadState({
        status: 'error',
        progress: 0,
        currentFile: '',
        totalFiles: 0,
        processedFiles: 0,
        errors: ['Nessun file FIT trovato'],
      });
      return { activities: [], wellness: [], sleep: [], errors: ['Nessun file FIT trovato'] };
    }

    // Process in batches to avoid timeout
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < fitFiles.length; i += BATCH_SIZE) {
      batches.push(fitFiles.slice(i, i + BATCH_SIZE));
    }

    let processedCount = 0;

    for (const batch of batches) {
      setUploadState(prev => ({
        ...prev,
        currentFile: `Elaborazione ${processedCount + 1}-${Math.min(processedCount + batch.length, fitFiles.length)} di ${fitFiles.length}`,
        progress: (processedCount / fitFiles.length) * 100,
      }));

      try {
        // Prepare files for API
        const apiFiles = batch
          .filter(f => f.content)
          .map(f => ({
            name: f.name,
            content: arrayBufferToBase64(f.content!),
          }));

        // Call API
        const response = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: apiFiles }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const result: ParseResponse = await response.json();

        if (result.activities) {
          allActivities.push(...result.activities);
        }
        if (result.wellness) {
          allWellness.push(...result.wellness);
        }
        if (result.sleep) {
          allSleep.push(...result.sleep);
        }
        if (result.errors) {
          allErrors.push(...result.errors);
        }
      } catch (e) {
        allErrors.push(`Errore batch: ${e}`);
      }

      processedCount += batch.length;
    }

    // Save to storage
    if (allActivities.length > 0) {
      addActivities(allActivities);
    }
    if (allWellness.length > 0) {
      addWellness(allWellness);
    }
    if (allSleep.length > 0) {
      addSleep(allSleep);
    }

    setUploadState({
      status: allErrors.length === 0 ? 'success' : 'error',
      progress: 100,
      currentFile: '',
      totalFiles: fitFiles.length,
      processedFiles: processedCount,
      errors: allErrors,
    });

    return {
      activities: allActivities,
      wellness: allWellness,
      sleep: allSleep,
      errors: allErrors,
    };
  }, []);

  const resetState = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: 0,
      currentFile: '',
      totalFiles: 0,
      processedFiles: 0,
      errors: [],
    });
  }, []);

  return {
    uploadState,
    processFiles,
    resetState,
  };
}
