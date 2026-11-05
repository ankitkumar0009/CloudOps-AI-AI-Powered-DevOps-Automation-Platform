import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Download, ArrowDown } from 'lucide-react';

interface LogViewerProps {
  logs: string[];
  title?: string;
  maxHeight?: string;
  isStreaming?: boolean;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  title = 'Console Output',
  maxHeight = 'h-80',
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([logs.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/\s+/g, '_')}_logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredLogs = filter
    ? logs.filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  return (
    <div className="bg-[#050811] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs shadow-2xl flex flex-col">
      {/* Console Top Bar */}
      <div className="bg-[#0b0f19] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">{title}</span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-0.5 bg-slate-900 border border-slate-700/80 rounded text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded hover:bg-slate-800 transition ${
              autoScroll ? 'text-indigo-400' : 'text-slate-500'
            }`}
            title="Toggle Auto-Scroll"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Download Logs"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Scrollable Body */}
      <div
        ref={scrollRef}
        className={`${maxHeight} p-4 overflow-y-auto terminal-scroll space-y-1 text-slate-300 select-text leading-relaxed`}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">No logs generated yet.</div>
        ) : (
          filteredLogs.map((line, idx) => {
            let color = 'text-slate-300';
            if (line.includes('[ERROR]') || line.includes('error') || line.includes('FAIL') || line.includes('Fatal')) {
              color = 'text-rose-400 font-medium';
            } else if (line.includes('[WARN]') || line.includes('Warning')) {
              color = 'text-amber-300';
            } else if (line.includes('[SUCCESS]') || line.includes('Successfully')) {
              color = 'text-emerald-400 font-medium';
            } else if (line.includes('[STEP') || line.includes('Step ')) {
              color = 'text-cyan-400 font-semibold';
            } else if (line.startsWith('#') || line.startsWith('$')) {
              color = 'text-indigo-400';
            }

            return (
              <div key={idx} className="flex gap-3 hover:bg-slate-900/40 px-1 py-0.5 rounded">
                <span className="text-slate-600 select-none w-8 text-right shrink-0">{idx + 1}</span>
                <span className={`break-all ${color}`}>{line}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

