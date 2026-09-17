import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  FolderGit2,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2
} from "lucide-react";
import { TerminalCommandResult } from "../types";

interface RealTerminalProps {
  initialCommand?: string;
  onCommandRun?: (cmd: string, result: TerminalCommandResult) => void;
}

export const RealTerminal: React.FC<RealTerminalProps> = ({
  initialCommand = "",
  onCommandRun
}) => {
  const [command, setCommand] = useState(initialCommand);
  const [history, setHistory] = useState<TerminalCommandResult[]>([
    {
      command: "uname -a && node -v",
      stdout: "Linux nexus-studio 6.6.0-container #1 SMP x86_64 GNU/Linux\nv22.14.0\n",
      stderr: "",
      exitCode: 0,
      executionTimeMs: 14,
      cwd: "/workspace",
      timestamp: new Date().toISOString()
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Script Runner state
  const [activeTab, setActiveTab] = useState<"terminal" | "runner">("terminal");
  const [runnerLang, setRunnerLang] = useState<"node" | "python" | "bash">("node");
  const [runnerCode, setRunnerCode] = useState<string>(
    `// Ejecutar lógica en el contenedor
const os = require('os');
console.log('--- Telemetría del Sistema ---');
console.log('Memoria libre:', (os.freemem() / 1024 / 1024).toFixed(2), 'MB');
console.log('CPUs activas:', os.cpus().length);
console.log('Tiempo activo:', Math.round(os.uptime()), 'segundos');`
  );

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const executeCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim() || isRunning) return;

    setIsRunning(true);
    try {
      const res = await fetch("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmdToRun })
      });
      const data = await res.json();

      const result: TerminalCommandResult = {
        command: cmdToRun,
        stdout: data.stdout || "",
        stderr: data.stderr || (data.error ? String(data.error) : ""),
        exitCode: data.exitCode !== undefined ? data.exitCode : data.error ? 1 : 0,
        executionTimeMs: data.executionTimeMs || 0,
        cwd: data.cwd || "/workspace",
        timestamp: data.timestamp || new Date().toISOString()
      };

      setHistory((prev) => [...prev, result]);
      if (onCommandRun) onCommandRun(cmdToRun, result);
      setCommand("");
      setHistoryIndex(-1);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          command: cmdToRun,
          stdout: "",
          stderr: err.message || "Error al conectar con el servicio de terminal",
          exitCode: 1,
          executionTimeMs: 0,
          cwd: "/workspace",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setCommand(history[nextIndex].command);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setCommand("");
      } else {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex].command);
      }
    }
  };

  const handleRunScript = () => {
    let finalCommand = "";
    if (runnerLang === "node") {
      // Escape for single-line node -e
      const escaped = runnerCode.replace(/"/g, '\\"');
      finalCommand = `node -e "${escaped}"`;
    } else if (runnerLang === "python") {
      const escaped = runnerCode.replace(/"/g, '\\"');
      finalCommand = `python3 -c "${escaped}"`;
    } else {
      finalCommand = runnerCode;
    }
    setActiveTab("terminal");
    executeCommand(finalCommand);
  };

  const handleCopyHistoryItem = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickPresets = [
    { label: "git status", cmd: "git status -s" },
    { label: "ls -la", cmd: "ls -la" },
    { label: "node & npm", cmd: "node -v && npm -v" },
    { label: "git branch", cmd: "git branch -a" },
    { label: "ps aux", cmd: "ps aux | head -n 8" },
    { label: "solidarities", cmd: "ls -la solidarities/" }
  ];

  return (
    <div className="space-y-4">
      {/* Header & Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-900 text-emerald-400 rounded-xl">
            <TerminalIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Terminal Real de Ejecución del Sistema</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full">
                bash / linux container
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Ejecuta comandos reales, scripts personalizados, verificaciones con Git y visualiza la salida en vivo.
            </p>
          </div>
        </div>

        {/* Tab switcher: Terminal vs Script Runner */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
            <button
              id="tab-btn-terminal-console"
              onClick={() => setActiveTab("terminal")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "terminal"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>Consola Bash</span>
            </button>
            <button
              id="tab-btn-code-runner"
              onClick={() => setActiveTab("runner")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "runner"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Ejecutor de Scripts</span>
            </button>
          </div>

          <button
            onClick={() => setHistory([])}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Limpiar historial de la terminal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Command Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
          Comandos Rápidos:
        </span>
        {quickPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => executeCommand(preset.cmd)}
            disabled={isRunning}
            className="text-xs font-mono bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg transition-all active:scale-95 shadow-2xs disabled:opacity-50 whitespace-nowrap"
          >
            $ {preset.label}
          </button>
        ))}
      </div>

      {/* Main Terminal Window */}
      {activeTab === "terminal" ? (
        <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col font-mono text-xs min-h-[420px] max-h-[640px]">
          {/* Terminal Titlebar */}
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-slate-400 text-[11px] font-bold">
                nexus-agent@container: /workspace
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              {isRunning && (
                <span className="flex items-center gap-1.5 text-amber-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Ejecutando proceso...
                </span>
              )}
              <span className="text-slate-500">{history.length} comandos registrados</span>
            </div>
          </div>

          {/* Terminal Output Log Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {history.map((item, idx) => (
              <div key={idx} className="space-y-1.5 group">
                {/* Command Line */}
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-emerald-400">nexus@studio</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-cyan-400">~</span>
                    <span className="text-slate-400">$</span>
                    <span className="text-white ml-1">{item.command}</span>
                  </div>

                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        item.exitCode === 0
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      exit: {item.exitCode} ({item.executionTimeMs}ms)
                    </span>
                    <button
                      onClick={() => handleCopyHistoryItem(item.stdout || item.stderr, idx)}
                      className="p-1 hover:text-white text-slate-500 rounded transition-colors"
                      title="Copiar salida"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stdout */}
                {item.stdout && (
                  <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed pl-2 font-mono overflow-x-auto text-[11px]">
                    {item.stdout}
                  </pre>
                )}

                {/* Stderr */}
                {item.stderr && (
                  <pre className="text-rose-400/90 whitespace-pre-wrap leading-relaxed pl-2 font-mono overflow-x-auto text-[11px]">
                    {item.stderr}
                  </pre>
                )}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 p-3 border-t border-slate-800 flex items-center gap-2"
          >
            <div className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
              <ChevronRight className="w-4 h-4 text-cyan-400" />
              <span>nexus:~$</span>
            </div>
            <input
              id="terminal-prompt-input"
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isRunning}
              placeholder="Escribe un comando bash (ej: git status, ls -la, python3 --version, curl httpbin.org/get)..."
              className="flex-1 bg-transparent text-white focus:outline-hidden placeholder-slate-600 text-xs font-mono"
            />
            <button
              id="btn-terminal-submit"
              type="submit"
              disabled={isRunning || !command.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-40"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Ejecutar</span>
            </button>
          </form>
        </div>
      ) : (
        /* Code Runner Playground */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Ejecutar Código Directo en el Servidor
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={runnerLang}
                onChange={(e) => setRunnerLang(e.target.value as any)}
                className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl"
              >
                <option value="node">Node.js (JavaScript / TypeScript)</option>
                <option value="python">Python 3</option>
                <option value="bash">Script Bash Shell</option>
              </select>

              <button
                id="btn-run-code-snippet"
                onClick={handleRunScript}
                disabled={isRunning}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar en Terminal</span>
              </button>
            </div>
          </div>

          <div>
            <textarea
              id="code-runner-textarea"
              rows={12}
              value={runnerCode}
              onChange={(e) => setRunnerCode(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Escribe o pega el código a ejecutar..."
            />
          </div>

          <p className="text-xs text-slate-500">
            El código se enviará directamente a la terminal real del contenedor y los resultados se
            mostrarán en la consola bash con métricas de tiempo de ejecución y estado de salida.
          </p>
        </div>
      )}
    </div>
  );
};
