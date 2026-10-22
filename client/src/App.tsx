import React, { useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@devnest/shared';

interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  supportedLanguages: string[];
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthStatus) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            DN
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">DevNest</h1>
            <p className="text-xs text-slate-400">Cloud IDE Monorepo Baseline</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Milestone 0: Active
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-2">System Status</h2>
          <p className="text-sm text-slate-400 mb-4">
            Verifying communication between React client, Node/Express server, and shared types package.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Server Connection Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <span className="text-xs uppercase font-medium tracking-wider text-slate-400">Backend API</span>
              <div className="mt-2 flex items-center space-x-2">
                {loading && <span className="text-sm text-amber-400 animate-pulse">Checking /api/health...</span>}
                {error && <span className="text-sm text-rose-400">Connection offline: {error}</span>}
                {health && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="text-sm font-medium text-emerald-300">{health.service} online</span>
                    </div>
                    <p className="text-xs text-slate-500">Timestamp: {health.timestamp}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shared Package Linking */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <span className="text-xs uppercase font-medium tracking-wider text-slate-400">@devnest/shared</span>
              <div className="mt-2">
                <span className="text-xs text-slate-400 block mb-2">Supported Execution Languages (imported from shared):</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langKey) => (
                    <span
                      key={langKey}
                      className="px-2 py-0.5 rounded text-xs bg-slate-800 border border-slate-700 text-slate-300"
                    >
                      {SUPPORTED_LANGUAGES[langKey].name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-3 text-center text-xs text-slate-500">
        DevNest &bull; Milestone 0 &bull; Monorepo Scaffolding
      </footer>
    </div>
  );
};

export default App;
