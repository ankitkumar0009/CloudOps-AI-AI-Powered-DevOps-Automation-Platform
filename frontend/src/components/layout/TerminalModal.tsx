import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Trash2 } from 'lucide-react';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand?: (cmd: string) => Promise<string>;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ isOpen, onClose, onRunCommand }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'CloudOps DevOps Platform Interactive Shell [v1.0.0-aws-eks]',
    'Connected to cluster: eks-prod-cluster (region: us-east-1)',
    'Type "help" for a list of available DevOps commands.\n',
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    setCmdHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput('');

    const newHistory = [...history, `$ ${cmd}`];

    if (cmd === 'clear') {
      setHistory([]);
      return;
    }

    if (cmd === 'help') {
      newHistory.push(
        'Available DevOps Automation Commands:\n' +
        '  kubectl get pods -n <ns>         : List Kubernetes pods\n' +
        '  kubectl describe pod <pod>       : Inspect pod events and status\n' +
        '  kubectl rollout undo deploy/<d>  : Revert deployment to previous revision\n' +
        '  docker ps                        : List active container runtimes\n' +
        '  aws ecr list-images --repo <r>   : Query AWS ECR image tags\n' +
        '  terraform plan                   : Show infrastructure execution diff\n' +
        '  clear                            : Clear terminal console\n'
      );
      setHistory(newHistory);
      return;
    }

    if (cmd.startsWith('kubectl get pods')) {
      newHistory.push(
        'NAME                                     READY   STATUS             RESTARTS   AGE\n' +
        'payment-gateway-7b8c6949f-2m8p1          1/1     Running            0          2h\n' +
        'payment-gateway-7b8c6949f-9x7q4          1/1     Running            0          2h\n' +
        'auth-service-58dc76b98-z41v8             1/1     Running            0          5h\n' +
        'orders-api-6f987c88b-8jk41               0/1     CrashLoopBackOff   4          28m\n'
      );
      setHistory(newHistory);
      return;
    }

    if (cmd.startsWith('docker ps')) {
      newHistory.push(
        'CONTAINER ID   IMAGE                                            COMMAND                  STATUS         PORTS\n' +
        '9f82c7a10b42   payment-gateway:v2.4.2                           "node src/index.js"      Up 2 hours     0.0.0.0:3000->3000/tcp\n' +
        '33a189f2d110   auth-service:v1.8.0                              "uvicorn app.main:app"   Up 5 hours     0.0.0.0:8000->8000/tcp\n'
      );
      setHistory(newHistory);
      return;
    }

    if (onRunCommand) {
      newHistory.push('Executing command on backend engine...');
      setHistory([...newHistory]);
      const res = await onRunCommand(cmd);
      setHistory((prev) => [...prev, res]);
    } else {
      newHistory.push(`[Output] Command "${cmd}" executed successfully on target cluster.`);
      setHistory(newHistory);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIndex = historyIndex + 1 < cmdHistory.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIndex);
      setInput(cmdHistory[cmdHistory.length - 1 - nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(cmdHistory[cmdHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-[#050811] border border-slate-800 rounded-xl flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullScreen ? 'w-full h-full' : 'max-w-4xl w-full h-[580px]'
        }`}
      >
        {/* Terminal Header */}
        <div className="bg-[#0b0f19] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-slate-200">
              devops-terminal ~ aws:us-east-1 (eks-prod)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistory([])}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="flex-1 p-4 font-mono text-xs overflow-y-auto terminal-scroll text-slate-200 space-y-1.5"
        >
          {history.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed">
              {line.startsWith('$') ? (
                <span className="text-emerald-400 font-semibold">{line}</span>
              ) : line.includes('Error') || line.includes('CrashLoopBackOff') ? (
                <span className="text-rose-400">{line}</span>
              ) : (
                <span className="text-slate-300">{line}</span>
              )}
            </div>
          ))}

          {/* Prompt Input Form */}
          <form onSubmit={handleCommand} className="flex items-center gap-2 pt-1">
            <span className="text-cyan-400 font-semibold">devops@eks-prod:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white caret-indigo-400"
              autoFocus
            />
          </form>
        </div>
      </div>
    </div>
  );
};
