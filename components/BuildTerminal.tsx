
import React, { useEffect, useRef } from 'react';
import { BuildLog } from '../types';

interface BuildTerminalProps {
  logs: BuildLog[];
}

const BuildTerminal: React.FC<BuildTerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 font-mono text-sm p-4 h-64 overflow-y-auto" ref={scrollRef}>
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-slate-500 ml-2 text-xs uppercase tracking-widest">Build Console</span>
      </div>
      {logs.length === 0 && (
        <div className="text-slate-600 animate-pulse">Waiting for process start...</div>
      )}
      {logs.map((log, idx) => (
        <div key={idx} className="mb-1">
          <span className="text-slate-500">[{log.timestamp}]</span>{' '}
          <span className={`
            ${log.level === 'info' ? 'text-blue-400' : ''}
            ${log.level === 'warn' ? 'text-yellow-400' : ''}
            ${log.level === 'error' ? 'text-red-400' : ''}
            ${log.level === 'success' ? 'text-green-400' : ''}
          `}>
            {log.level.toUpperCase()}:
          </span>{' '}
          <span className="text-slate-300">{log.message}</span>
        </div>
      ))}
    </div>
  );
};

export default BuildTerminal;
