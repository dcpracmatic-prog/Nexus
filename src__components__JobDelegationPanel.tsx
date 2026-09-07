import React, { useState } from "react";
import {
  Send,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  ServerCrash,
  Cpu,
  ShieldAlert,
  BrainCircuit,
  Layers,
  History,
  Terminal,
  Activity,
  Zap,
  Sliders,
  FlaskConical,
  Globe,
  Radio,
  FileCode2,
  FolderGit2
} from "lucide-react";
import { DelegatedJob, Agent, Project, VectorDocument, SolidarityTool } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface JobDelegationPanelProps {
  jobs: DelegatedJob[];
  agents: Agent[];
  projects: Project[];
  vectorDocs: VectorDocument[];
  solidarities?: SolidarityTool[];
  forceLlamaFallback: boolean;
  selectedProjectId?: string;
  onJobCreated: (newJob: DelegatedJob) => void;
}

export const JobDelegationPanel: React.FC<JobDelegationPanelProps> = ({
  jobs,
  agents,
  projects,
  vectorDocs,
  solidarities = [],
  forceLlamaFallback,
  selectedProjectId,
  onJobCreated
}) => {
  // Execution Mode: Testbench Benchmark Demo vs Open Implementation
  const [executionMode, setExecutionMode] = useState<"open_implementation" | "testbench_demo">("open_implementation");

  // Job Form State
  const [jobTitle, setJobTitle] = useState("Procesar Consulta Inteligente con Agente");
  const [targetProjectId, setTargetProjectId] = useState(selectedProjectId || projects[0]?.id || "");
  const [selectedAgentId, setSelectedAgentId] = useState("agent-supervisor");
  const [inputPayload, setInputPayload] = useState(
    "Analizar los requisitos del proyecto, sintetizar la arquitectura del flujo y generar una respuesta técnica detallada con código de ejemplo y validaciones."
  );
  const [modelChoice, setModelChoice] = useState<string>("gemini-3.5-flash");
  const [thinkingMode, setThinkingMode] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>(["observe", "vector_rag"]);

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [consoleViewTab, setConsoleViewTab] = useState<"purified" | "telemetry" | "raw">("purified");

  const handleToolToggle = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleRunJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !inputPayload.trim()) return;

    setIsExecuting(true);
    setCurrentExecution(null);

    const assignedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inputPayload,
          role: assignedAgent.role,
          systemPrompt: assignedAgent.systemPrompt,
          modelPreference: modelChoice,
          thinkingMode,
          forceFallback: forceLlamaFallback,
          tools: selectedTools,
          contextDocuments: vectorDocs.slice(0, 3)
        })
      });

      const data = await response.json();
      setCurrentExecution(data);

      const newJob: DelegatedJob = {
        id: `job-${Date.now()}`,
        projectId: targetProjectId,
        title: jobTitle,
        description: inputPayload.slice(0, 120),
        assignedAgentIds: [assignedAgent.id],
        inputPayload,
        status: "completed",
        outputResult: data.content,
        usedModel: data.modelUsed,
        fallbackUsed: data.fallbackTriggered,
        fallbackReason: data.fallbackReason,
        durationMs: data.executionTimeMs,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        telemetry: data.edgeObserverTelemetry
          ? {
              frictionScore: data.edgeObserverTelemetry.guardrailAudit.frictionScore,
              regime: data.edgeObserverTelemetry.guardrailAudit.regime,
              noiseScore: data.edgeObserverTelemetry.guardrailAudit.noiseScore
            }
          : undefined
      };

      onJobCreated(newJob);
    } catch (err: any) {
      console.error("Job execution error:", err);
      setCurrentExecution({
        content: "Fallo temporal en la ejecución de la tarea. Verifique la conexión o active el modo de respaldo LLaMA.",
        modelUsed: "Error",
        fallbackTriggered: true
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Mode Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Panel Interactivo de Delegación de Trabajos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Crea y delega tareas a agentes especializados con acceso a herramientas deterministas y memoria semántica.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            id="tab-btn-create-job"
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "create" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
            }`}
          >
            Delegar Trabajo
          </button>
          <button
            id="tab-btn-history-job"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "history" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial ({jobs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "create" ? (
        <div className="space-y-4">
          {/* Execution Mode Selector: Testbench Demo vs Open Implementation */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Modo de Operación:
              </span>
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setExecutionMode("open_implementation");
                    setSelectedTools(["observe", "vector_rag"]);
                    setInputPayload("Analizar requerimientos y despachar acciones en la aplicación web mediante el conector API.");
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    executionMode === "open_implementation"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Libre Implementación (APIs / SDKs / MPCs / Apps)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExecutionMode("testbench_demo");
                    setSelectedTools(["morph_ba", "observe"]);
                    setInputPayload("Ejecutar algoritmo MORPH con N=4096 vértices y presupuesto de 50ms (semilla 42). Reportar solución factible de Maximum Independent Set.");
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    executionMode === "testbench_demo"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Pruebas Testbench (Solo Demostración)</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-md text-right">
              {executionMode === "testbench_demo"
                ? "Demostración científica de grafos y SpMM. No restringe la arquitectura del sistema."
                : "Libre para conectar con tus APIs, SDKs, servidores MPC y ejecutar acciones en tus apps."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Delegation Config Form (Left 5 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Configuración del Trabajo</span>
              </h3>

              <form onSubmit={handleRunJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Destino</label>
                  <select
                    id="job-project-select"
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Trabajo *</label>
                  <input
                    id="job-title-input"
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agente Especialista</label>
                  <select
                    id="job-agent-select"
                    value={selectedAgentId}
                    onChange={(e) => {
                      setSelectedAgentId(e.target.value);
                      const ag = agents.find((a) => a.id === e.target.value);
                      if (ag) {
                        setModelChoice(ag.model);
                        setThinkingMode(ag.thinkingMode);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model Choice & Reasoning Mode */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Modelo de Inteligencia Artificial
                    </label>
                    <select
                      id="job-model-select"
                      value={modelChoice}
                      onChange={(e) => setModelChoice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (High Thinking)</option>
                      <option value="gemini-3.5-flash">Gemini 3.5 Flash (General Intelligence)</option>
                      <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Low-Latency)</option>
                      <option value="llama-3-8b-fallback">LLaMA-3 / Qwen Local Fallback</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Thinking Mode (gemini-3.1-pro)</span>
                    <input
                      id="job-thinking-toggle"
                      type="checkbox"
                      checked={thinkingMode}
                      onChange={(e) => setThinkingMode(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Tools Selection based on mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Herramientas y Solidaridades Conectadas
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {executionMode === "testbench_demo" ? (
                      <>
                        <label className="flex items-start gap-2 p-2 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={selectedTools.includes("morph_ba")}
                            onChange={() => handleToolToggle("morph_ba")}
                            className="mt-0.5 w-3.5 h-3.5 accent-amber-600 rounded"
                          />
                          <div>
                            <p className="font-semibold text-amber-950">MORPH MIS Solver (Demo Testbench)</p>
                            <p className="text-[10px] text-amber-800">Benchmark heurístico de grafos Barabási-Albert</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 p-2 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={selectedTools.includes("hbag_spmm")}
                            onChange={() => handleToolToggle("hbag_spmm")}
                            className="mt-0.5 w-3.5 h-3.5 accent-amber-600 rounded"
                          />
                          <div>
                            <p className="font-semibold text-amber-950">HBAG SpMM Accelerator (Demo Testbench)</p>
                            <p className="text-[10px] text-amber-800">Benchmark de multiplicación matricial dispersa</p>
                          </div>
                        </label>
                      </>
                    ) : null}

                    <label className="flex items-start gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes("observe")}
                        onChange={() => handleToolToggle("observe")}
                        className="mt-0.5 w-3.5 h-3.5 accent-indigo-600 rounded"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">Edge Observer Guardrail</p>
                        <p className="text-[10px] text-slate-500">Telemetría de estabilidad y control de alucinaciones</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTools.includes("vector_rag")}
                        onChange={() => handleToolToggle("vector_rag")}
                        className="mt-0.5 w-3.5 h-3.5 accent-indigo-600 rounded"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">Memoria Vectorial RAG</p>
                        <p className="text-[10px] text-slate-500">Recuperación semántica de documentos del proyecto</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Input Payload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instrucciones Específicas del Trabajo *
                  </label>
                  <textarea
                    id="job-payload-input"
                    required
                    rows={4}
                    value={inputPayload}
                    onChange={(e) => setInputPayload(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    placeholder="Detalla las instrucciones y parámetros para el agente..."
                  />
                </div>

                <button
                  id="btn-execute-job"
                  type="submit"
                  disabled={isExecuting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-98 disabled:opacity-50"
                >
                  <Play className={`w-4 h-4 fill-current ${isExecuting ? "animate-spin" : ""}`} />
                  <span>{isExecuting ? "Ejecutando y Delegando..." : "Delegar y Ejecutar Trabajo"}</span>
                </button>
              </form>
            </div>

            {/* Execution Terminal & Results (Right 7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden flex flex-col h-full min-h-[520px]">
                {/* Terminal Header with View Tabs */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-200">
                      Consola de Ejecución en Vivo
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setConsoleViewTab("purified")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        consoleViewTab === "purified"
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Respuesta Purificada
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsoleViewTab("telemetry")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        consoleViewTab === "telemetry"
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Telemetría & Tools
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentExecution?.fallbackTriggered && (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                        <ServerCrash className="w-3 h-3" /> Respaldo LLaMA Activo
                      </span>
                    )}
                    {currentExecution && !currentExecution.fallbackTriggered && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> {currentExecution.modelUsed}
                      </span>
                    )}
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-5 flex-1 font-mono text-xs text-slate-300 overflow-y-auto space-y-4 leading-relaxed bg-slate-950">
                  {isExecuting ? (
                    <div className="py-20 text-center space-y-3 font-sans">
                      <Activity className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                      <p className="text-indigo-300 font-semibold">
                        Orquestando Agente y Consultando Base Vectorial...
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Evaluando guardrails y ejecutando herramientas deterministas
                      </p>
                    </div>
                  ) : currentExecution ? (
                    <div className="space-y-4">
                      {/* Diagnostic metadata */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Modelo ejecutado:</span>
                          <span className="font-bold text-indigo-300">{currentExecution.modelUsed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tiempo de inferencia:</span>
                          <span className="text-slate-200">{currentExecution.executionTimeMs} ms</span>
                        </div>
                        {currentExecution.fallbackReason && (
                          <div className="text-rose-300 pt-1 border-t border-slate-800 text-[10px]">
                            <strong>Failover Rationale:</strong> {currentExecution.fallbackReason}
                          </div>
                        )}
                      </div>

                      {consoleViewTab === "purified" && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-slate-900 font-sans shadow-inner">
                          <MarkdownRenderer content={currentExecution.content} />
                        </div>
                      )}

                      {consoleViewTab === "telemetry" && (
                        <div className="space-y-3 font-sans">
                          {currentExecution.edgeObserverTelemetry && (
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                              <p className="font-bold text-cyan-400 flex items-center gap-1 text-xs">
                                <Activity className="w-3.5 h-3.5" /> Telemetría Edge Observer Guardrails
                              </p>
                              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Régimen</span>
                                  <span className="font-bold text-emerald-400">
                                    {currentExecution.edgeObserverTelemetry.guardrailAudit.regime}
                                  </span>
                                </div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Fricción</span>
                                  <span className="font-bold text-cyan-300">
                                    {currentExecution.edgeObserverTelemetry.guardrailAudit.frictionScore}
                                  </span>
                                </div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                  <span className="text-[10px] text-slate-400 block">Ruido SWAR</span>
                                  <span className="font-bold text-amber-300">
                                    {currentExecution.edgeObserverTelemetry.guardrailAudit.noiseScore}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {currentExecution.toolResults && Object.keys(currentExecution.toolResults).length > 0 && (
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                              <p className="font-bold text-amber-400 mb-2">Herramientas Deterministas Ejecutadas:</p>
                              <pre className="overflow-x-auto text-[10px] text-emerald-400 bg-slate-950 p-3 rounded border border-slate-800">
                                {JSON.stringify(currentExecution.toolResults, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-24 text-center text-slate-500 space-y-2 font-sans">
                      <Terminal className="w-8 h-8 mx-auto text-slate-700" />
                      <p className="text-xs">Configura las directivas en el panel izquierdo y presiona "Delegar y Ejecutar Trabajo".</p>
                      <p className="text-[11px] text-slate-600">
                        La consola capturará trazas en tiempo real y renderizará la respuesta purificada de Markdown.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Registro Histórico de Trabajos Delegados
            </h3>
            <span className="text-xs text-slate-500">{jobs.length} ejecuciones registradas</span>
          </div>

          <div className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const project = projects.find((p) => p.id === job.projectId);
              return (
                <div key={job.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <h4 className="text-xs font-bold text-slate-900">{job.title}</h4>
                      {project && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {project.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          job.fallbackUsed
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {job.usedModel || "Gemini"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{job.durationMs || 120}ms</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <MarkdownRenderer content={job.outputResult} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
