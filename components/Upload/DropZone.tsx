'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileArchive, File, X } from 'lucide-react';
import { FileInfo } from '@/lib/types';

interface DropZoneProps {
  onFilesSelected: (files: FileInfo[]) => void;
  isProcessing: boolean;
}

export default function DropZone({ onFilesSelected, isProcessing }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    const files: FileInfo[] = [];

    for (const file of Array.from(fileList)) {
      const extension = file.name.toLowerCase().split('.').pop();
      let type: 'fit' | 'zip' | 'unknown' = 'unknown';

      if (extension === 'fit') {
        type = 'fit';
      } else if (extension === 'zip') {
        type = 'zip';
      }

      if (type !== 'unknown') {
        const content = await file.arrayBuffer();
        files.push({
          name: file.name,
          size: file.size,
          type,
          content,
        });
      }
    }

    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  }, [processFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const handleProcess = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  }, [selectedFiles, onFilesSelected]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".fit,.zip"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-200">
              Trascina qui i tuoi file
            </p>
            <p className="text-sm text-slate-400 mt-1">
              File FIT singoli o ZIP di Garmin Connect
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isProcessing}
          >
            Sfoglia file
          </button>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">
              File selezionati ({selectedFiles.length})
            </h3>
            <button
              onClick={clearFiles}
              className="text-sm text-slate-400 hover:text-slate-200"
              disabled={isProcessing}
            >
              Rimuovi tutti
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                {file.type === 'zip' ? (
                  <FileArchive className="w-5 h-5 text-yellow-500" />
                ) : (
                  <File className="w-5 h-5 text-blue-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-slate-700 rounded"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={isProcessing || selectedFiles.length === 0}
            className="btn btn-primary w-full"
          >
            {isProcessing ? 'Elaborazione...' : `Analizza ${selectedFiles.length} file`}
          </button>
        </div>
      )}
    </div>
  );
}
