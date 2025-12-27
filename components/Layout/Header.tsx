'use client';

import Link from 'next/link';
import { Activity } from 'lucide-react';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  children?: React.ReactNode;
}

export default function Header({ showBackButton, title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Back */}
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Indietro
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">
                  Garmin Analyzer
                </span>
              </Link>
            )}
            
            {title && (
              <>
                <span className="text-slate-600">/</span>
                <h1 className="font-medium text-slate-200">{title}</h1>
              </>
            )}
          </div>

          {/* Actions */}
          {children && (
            <div className="flex items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
