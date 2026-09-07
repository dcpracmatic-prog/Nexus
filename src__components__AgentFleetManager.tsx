import React, { useState } from "react";
import {
  Users,
  Brain,
  Zap,
  Sliders,
  Sparkles,
  ShieldCheck,
  ServerCrash,
  CheckCircle2,
  Terminal,
  Play,
  Settings2,
  Plus
} from "lucide-react";
import { Agent, AgentModelType } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AgentFleetManagerProps {
  agents: Agent[];
  onUpdateAgent: (agent: Agent) => void;
  onAddNewAgent: (agent: Partial<Agent>) => void;
  forceLlamaFallback: boolean;
}

export const AgentFleetManager: React.FC<AgentFleetManagerProps> = ({
  agents,
  onUpdateAgent,
  onAddNewAgent,
  forceLlamaFallback
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || "");
  const [isEditing, setIsEditing] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Proporciona un reporte de estado técnico y verifica tus herramientas.");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleTestAgent = async () => {
    if (!selectedAgent) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: testPrompt,
          role: selectedAgent.role,
          systemPrompt: selectedAgent.systemPrompt,
          modelPreference: selectedAgent.model,
          thinkingMode: selectedAgent.thinkingMode,
          forceFallback: forceLlamaFallback,
          tools: selectedAgent.tools
        })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        content: "Error al comunicar con el agente en este entorno.",
        modelUsed: "Error",
        fallbackTriggered: true
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Gestor de Flota de Agentes Autónomos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura roles, instrucciones de sistema, modos de razonamiento y herramientas deterministas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            {agents.length} Agentes Registrados
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agent List (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Agentes Disponibles</h3>
          <div className="space-y-2">
            {agents.map((ag) => {
              const isSelected = ag.id === selectedAgent?.id;
              return (
                <div
                  key={ag.id}
                  id={`agent-list-card-${ag.id}`}
                  onClick={() => {
                    setSelectedAgentId(ag.id);
                    setTestResult(null);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center shrink-0 ${ag.avatarColor}`}
                  >
                    {ag.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{ag.name}</h4>
                      {ag.thinkingMode && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                          Thinking
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{ag.role}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>{ag.model}</span>
                      <span>·</span>
                      <span>{ag.tools.length} Tools</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Agent Details & Editor (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedAgent && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              {/* Agent Title & Basic Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-md ${selectedAgent.avatarColor}`}
                  >
                    {selectedAgent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedAgent.name}</h3>
                    <p className="text-xs text-indigo-600 font-semibold">{selectedAgent.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="toggle-edit-agent"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>{isEditing ? "Guardar y Salir" : "Editar Parámetros"}</span>
                  </button>
                </div>
              </div>

              {/* Agent Settings Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descripción de Responsabilidad</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={selectedAgent.description}
                      onChange={(e) => onUpdateAgent({ ...selectedAgent, description: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    />
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedAgent.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Modelo Asignado</label>
                    {isEditing ? (
                      <select
                        value={selectedAgent.model}
                        onChange={(e) =>
                          onUpdateAgent({ ...selectedAgent, model: e.target.value as AgentModelType })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (High Thinking)</option>
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                        <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                        <option value="llama-3-8b-fallback">LLaMA 3 Local Fallback</option>
                      </select>
                    ) : (
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                        {selectedAgent.model}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Modo Thinking (Razonamiento)</label>
                    {isEditing ? (
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={selectedAgent.thinkingMode}
                          onChange={(e) => onUpdateAgent({ ...selectedAgent, thinkingMode: e.target.checked })}
                          className="w-4 h-4 accent-purple-600 rounded"
                        />
                        <span className="text-xs font-semibold text-slate-700">Activar ThinkingLevel.HIGH</span>
                      </label>
                    ) : (
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg inline-block ${
                          selectedAgent.thinkingMode
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selectedAgent.thinkingMode ? "Activo (gemini-3.1-pro-preview)" : "Inactivo"}
                      </span>
                    )}
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instrucción del Sistema (System Prompt)
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      value={selectedAgent.systemPrompt}
                      onChange={(e) => onUpdateAgent({ ...selectedAgent, systemPrompt: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                    />
                  ) : (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed">
                      {selectedAgent.systemPrompt}
                    </div>
                  )}
                </div>

                {/* Deterministic Tools */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Herramientas Conectadas</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.tools.map((tool) => (
                      <span
                        key={tool}
                        className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Sandbox Test for this agent */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sandbox de Prueba Unitaria para {selectedAgent.name}</span>
                  </h4>

                  <div className="flex gap-2">
                    <input
                      id="agent-sandbox-input"
                      type="text"
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                    />
                    <button
                      id="btn-test-agent"
                      onClick={handleTestAgent}
                      disabled={isTesting}
                      className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isTesting ? "Evaluando..." : "Testear Agente"}</span>
                    </button>
                  </div>

                  {testResult && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-inner space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono border-b border-slate-100 pb-2">
                        <span className="font-bold text-indigo-700">Modelo: {testResult.modelUsed}</span>
                        <span>{testResult.executionTimeMs} ms</span>
                      </div>
                      <MarkdownRenderer content={testResult.content} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
