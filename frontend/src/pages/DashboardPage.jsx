import React, { useEffect, useState } from 'react';
import { Database, ShieldAlert, ShieldCheck, Tag } from 'lucide-react';

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLabel = async (id, label) => {
    try {
      await fetch('http://localhost:3001/api/logs/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label })
      });
      fetchLogs();
    } catch (error) {
      console.error('Failed to label:', error);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
          <Database className="text-blue-500" />
          Security Telemetry Logs
        </h2>
        <div className="text-sm text-slate-400 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          Auto-refreshing every 1m
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl flex-1 overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center h-full text-slate-400">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="flex justify-center items-center h-full text-slate-400">No logs found. Connect a detector to start streaming telemetry.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/50 sticky top-0 text-slate-300 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-slate-700">Time</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-700">Session ID</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-700">Trust Score</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-700">Flags</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-700">Ground Truth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map((log) => {
                  const flags = JSON.parse(log.flags || "[]");
                  const date = new Date(log.timestamp).toLocaleTimeString();
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 text-slate-400">{date}</td>
                      <td className="px-6 py-4 font-mono text-blue-300/80">{log.session_id}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 font-bold ${log.score >= 80 ? 'text-emerald-400' : log.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {log.score >= 80 ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                          {Math.round(log.score)}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {flags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {flags.map((flag, idx) => (
                              <span key={idx} className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs">
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleLabel(log.id, 'real')}
                            className={`px-3 py-1 rounded text-xs transition-colors border ${log.label === 'real' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-emerald-500/30 hover:text-emerald-300'}`}
                          >
                            Real
                          </button>
                          <button 
                            onClick={() => handleLabel(log.id, 'fake')}
                            className={`px-3 py-1 rounded text-xs transition-colors border ${log.label === 'fake' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-red-500/30 hover:text-red-300'}`}
                          >
                            Deepfake
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
