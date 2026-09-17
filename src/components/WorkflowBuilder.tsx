import React, { useState } from "react";
import {
  Workflow as WorkflowIcon,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Zap,
  Brain,
  ShieldCheck,
  ServerCrash,
  ArrowDown,
  Sparkles,
  Database,
  Cpu,
  Layers,
  ChevronRight
} from "lucide-react";
import { Workflow, WorkflowStep, Agent, VectorDocument, Project } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface WorkflowBuilderProps {
  workflows: Workflow[];
  agents: Agent[];
  projects: Project[];
  vectorDocs: VectorDocument[];
  forceLlamaFallback: boolean;
  onSaveWorkflow: (wf: Workflow) => void;
  onRunWorkflowSuccess?: (result: any) => void;
  selectedProjectId?: string;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflows,
  agents,
  projects,
  vectorDocs,
  forceLlamaFallback,
  onSaveWorkflow,
  onRunWorkflowSuccess,
  selectedProjectId
}) => {
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(
    workflows.find((w) => (selectedProjectId ? w.projectId === selectedProjectId : true))?.id ||
      workflows[0]?.id ||
      ""
  );
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [customInput, setCustomInput] = useState(
    "Ejecutar verificación sobre grafo de 4096 nodos con límite de tiempo de 50ms para Barabási-Albert. Validar consistencia matemática."
  );

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  const handleAddStep = () => {
    if (!activeWorkflow) return;
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: `Paso ${activeWorkflow.steps.length + 1}: Análisis Especializado`,
      agentId: agents[0]?.id || "agent-supervisor",
      agentRole: agents[0]?.role || "Supervisor",
      taskDescription: "Procesar los artefactos del paso previo y aplicar análisis específico.",
      model: "gemini-3.5-flash",
      highThinking: false,
      lowLatency: false,
      tools: ["vector_rag"]
    };

    const updatedWorkflow: Workflow = {
      ...activeWorkflow,
      steps: [...activeWorkflow.steps, newStep]
    };
    onSaveWorkflow(updatedWorkflow);
  };

  const handleRemoveStep = (stepId: string) => {
    if (!activeWorkflow || activeWorkflow.steps.length <= 1) return;
    const updatedWorkflow: Workflow = {
      ...activeWorkflow,
      steps: activeWorkflow.steps.filter((s) => s.id !== stepId)
    };
    onSaveWorkflow(updatedWorkflow);
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!activeWorkflow) return;
    const updatedWorkflow: Workflow = {
      ...activeWorkflow,
      steps: activeWorkflow.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    };
    onSaveWorkflow(updatedWorkflow);
  };

  const executeWorkflow = async () => {
    if (!activeWorkflow) return;
    setIsRunning(true);
    setExecutionResult(null);

    try {
      const response = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: activeWorkflow,
          inputPayload: customInput,
          forceFallback: forceLlamaFallback,
          vectorContext: vectorDocs.slice(0, 4)
        })
      });

      const data = await response.json();
      setExecutionResult(data);
      if (onRunWorkflowSuccess) {
        onRunWorkflowSuccess(data);
      }
    } catch (err: any) {
      console.error("Error executing workflow:", err);
      setExecutionResult({
        error: "Fallo de comunicación en servidor. Se ejecutó recuperación local.",
        trace: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Selector & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <WorkflowIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Diseñador y Ejecutor de Flujos de Trabajo</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatiza pipelines multi-agente con enlace secuencial, RAG vectorial y tolerancia a fallos con LLaMA.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            id="select-active-workflow"
            value={activeWorkflow?.id}
            onChange={(e) => {
              setActiveWorkflowId(e.target.value);
              setExecutionResult(null);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.steps.length} pasos)
              </option>
            ))}
          </select>

          <button
            id="btn-run-workflow"
            onClick={executeWorkflow}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
            <span>{isRunning ? "Ejecutando Flujo..." : "Ejecutar Flujo Completo"}</span>
          </button>
        </div>
      </div>

      {/* Input payload & Vector Store reference context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Entrada Inicial del Pipeline (Payload de Arranque)</span>
            </label>
            <span className="text-[11px] text-slate-400">Pasa al Paso 1 y se enriquece en la cadena</span>
          </div>
          <textarea
            id="workflow-initial-payload"
            rows={2}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            placeholder="Especifica las directivas o parámetros iniciales..."
          />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-600" />
              <span>RAG Vectorial Auto-Indexado</span>
            </span>
            <span className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-bold">
              {vectorDocs.length} Documentos
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Cada agente consulta automáticamente la base de datos vectorial para inyectar contexto técnico y reglas
            deterministas antes de generar su respuesta.
          </p>
        </div>
      </div>

      {/* Steps Pipeline Layout */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cadena de Pasos ({activeWorkflow?.steps.length || 0})
          </h3>
          <button
            id="btn-add-step"
            onClick={handleAddStep}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Paso al Flujo</span>
          </button>
        </div>

        {activeWorkflow?.steps.map((step, idx) => {
          const assignedAgent = agents.find((a) => a.id === step.agentId) || agents[0];

          return (
            <div key={step.id} className="relative">
              {/* Step Card */}
              <div
                id={`workflow-step-card-${step.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="h-7 w-7 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                      className="font-bold text-slate-900 text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-hidden px-1"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* High Thinking Badge / Toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateStep(step.id, { highThinking: !step.highThinking })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        step.highThinking
                          ? "bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-400/20"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Activa el modo de razonamiento profundo con gemini-3.1-pro-preview"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Thinking Mode</span>
                    </button>

                    {/* Low Latency Toggle */}
                    <button
                      type="button"
                      onClick={() => handleUpdateStep(step.id, { lowLatency: !step.lowLatency })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        step.lowLatency
                          ? "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Activa baja latencia con gemini-3.1-flash-lite"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Ultra Low-Latency</span>
                    </button>

                    {activeWorkflow.steps.length > 1 && (
                      <button
                        onClick={() => handleRemoveStep(step.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                        title="Eliminar paso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Agent Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Agente Asignado
                    </label>
                    <select
                      value={step.agentId}
                      onChange={(e) => {
                        const ag = agents.find((a) => a.id === e.target.value);
                        handleUpdateStep(step.id, {
                          agentId: e.target.value,
                          agentRole: ag?.role || "Especialista"
                        });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                      Herramientas: {assignedAgent.tools.join(", ") || "Ninguna"}
                    </p>
                  </div>

                  {/* Task Instructions */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Directiva de Tarea para este Paso
                    </label>
                    <input
                      type="text"
                      value={step.taskDescription}
                      onChange={(e) => handleUpdateStep(step.id, { taskDescription: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Describe qué debe realizar este agente..."
                    />
                  </div>
                </div>
              </div>

              {/* Connector Down Arrow between steps */}
              {idx < activeWorkflow.steps.length - 1 && (
                <div className="flex justify-center my-1.5">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-2xs">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Execution Trace and Artifact Output */}
      {executionResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Resultado y Traza de Ejecución Multi-Agente
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-slate-500">Duración: {executionResult.overallDurationMs} ms</span>
              {executionResult.anyFallbackTriggered && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <ServerCrash className="w-3 h-3" /> Respaldo LLaMA Invocado
                </span>
              )}
            </div>
          </div>

          {/* Timeline of Steps */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Desglose de Pasos Ejecutados
            </p>
            {executionResult.trace?.map((traceStep: any) => (
              <div
                key={traceStep.stepIndex}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700">Paso {traceStep.stepIndex}:</span>
                    <span className="font-semibold text-slate-900">{traceStep.stepName}</span>
                    <span className="text-slate-500">({traceStep.agentRole})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        traceStep.fallbackTriggered
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {traceStep.modelUsed}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{traceStep.durationMs}ms</span>
                  </div>
                </div>

                {traceStep.fallbackReason && (
                  <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                    <strong>Motivo de conmutación:</strong> {traceStep.fallbackReason}
                  </p>
                )}

                <div className="bg-white p-3 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                  <MarkdownRenderer content={traceStep.output} />
                </div>

                {traceStep.toolResults && (
                  <div className="text-[11px] bg-slate-100 p-2 rounded font-mono text-slate-700 overflow-x-auto">
                    <p className="font-bold text-slate-600 mb-1">Resultados Deterministas de Herramientas:</p>
                    <pre className="text-[10px]">{JSON.stringify(traceStep.toolResults, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Combined Output Artifact */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Artefacto de Síntesis Final
            </h4>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <MarkdownRenderer content={executionResult.finalArtifact} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
