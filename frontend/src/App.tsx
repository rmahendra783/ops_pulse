import { useEffect, useState } from "react";
import { apiClient } from "./lib/api";

interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<HealthStatus>("/health")
      .then((res) => {
        setHealth(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to reach Rails backend");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-2xl">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">OpsPulse Hub</h1>
        <p className="text-xs text-slate-400 mb-4">Rails API + React Architecture</p>

        {loading && <p className="text-slate-400 text-sm">Connecting to Rails backend...</p>}

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {health && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-emerald-400 uppercase tracking-wider">{health.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service:</span>
              <span className="font-medium text-slate-200">{health.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-xs text-slate-400">{health.timestamp}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;