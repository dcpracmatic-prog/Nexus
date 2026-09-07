import React, { useState } from "react";
import {
  HeartHandshake,
  FolderGit2,
  Globe,
  Radio,
  Sliders,
  Plus,
  Trash2,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  FileCode2,
  Sparkles,
  Layers,
  FlaskConical,
  ShieldAlert,
  Send
} from "lucide-react";
import { SolidarityTool, SolidarityType, ActionDispatchResult } from "../types";

interface SolidaritiesListProps {
  solidarities: SolidarityTool[];
  onAddSolidarity: (tool: Partial<SolidarityTool>) => Promise<void>;
  onDeleteSolidarity: (id: string) => Promise<void>;
  onToggleSolidarity: (id: string, enabled: boolean) => Promise<void>;
}

export const SolidaritiesList: React.FC<SolidaritiesListProps> = ({
  solidarities,
  onAddSolidarity,
  onDeleteSolidarity,
  onToggleSolidarity
}) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // GitHub Clone Modal
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneRepoUrl, setCloneRepoUrl] = useState("");
  const [cloneBranch, setCloneBranch] = useState("main");
  const [cloneCustomName, setCloneCustomName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [isCloning, setIsCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState<any>(null);

  // App Action / API Connector Modal
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionName, setActionName] = useState("");
  const [actionUrl, setActionUrl] = useState("https://httpbin.org/post");
  const [actionMethod, setActionMethod] = useState<"POST" | "GET" | "PUT" | "DELETE">("POST");
  const [actionAuthType, setActionAuthType] = useState<"none" | "bearer" | "api_key">("bearer");
  const [actionAuthSecret, setActionAuthSecret] = useState("token_usuario_secreto");
  const [actionPayload, setActionPayload] = useState(
    JSON.stringify({ event: "AGENT_TRIGGER", timestamp: new Date().toISOString() }, null, 2)
  );
  const [isTestingAction, setIsTestingAction] = useState(false);
  const [actionTestResult, setActionTestResult] = useState<ActionDispatchResult | null>(null);

  // MPC Connector Modal
  const [isMpcModalOpen, setIsMpcModalOpen] = useState(false);
  const [mpcName, setMpcName] = useState("");
  const [mpcEndpoint, setMpcEndpoint] = useState("http://localhost:3000/api/mcp");
  const [mpcToolsInput, setMpcToolsInput] = useState("file_system, database_query, web_search");

  // Handle Git Clone
  const handleGitClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneRepoUrl.trim()) return;

    setIsCloning(true);
    setCloneResult(null);

    try {
      const res = await fetch("/api/solidarities/clone-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: cloneRepoUrl.trim(),
          branch: cloneBranch.trim(),
          customName: cloneCustomName.trim()
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al clonar el repositorio");
      }

      setCloneResult(data);

      // Save tool into Solidarities collection
      await onAddSolidarity({
        name: cloneCustomName.trim() || data.repoName,
        category: "Herramientas GitHub",
        type: "github_repo",
        description:
          cloneDescription.trim() ||
          data.packageInfo?.description ||
          "Herramienta y scripts clonados directamente desde GitHub.",
        enabled: true,
        repoUrl: cloneRepoUrl.trim(),
        branch: cloneBranch.trim(),
        clonedPath: data.clonedPath,
        cloneStatus: "cloned",
        isTestbenchDemo: false,
        tags: ["GitHub", "Git Clone", data.repoName]
      });

      // Reset form after short delay
      setTimeout(() => {
        setIsCloneModalOpen(false);
        setCloneRepoUrl("");
        setCloneCustomName("");
        setCloneDescription("");
        setCloneResult(null);
      }, 1500);
    } catch (err: any) {
      setCloneResult({ error: err.message });
    } finally {
      setIsCloning(false);
    }
  };

  // Handle Test & Save App Action
  const handleTestAppAction = async () => {
    setIsTestingAction(true);
    setActionTestResult(null);

    try {
      let parsedPayload = null;
      try {
        parsedPayload = JSON.parse(actionPayload);
      } catch {
        parsedPayload = actionPayload;
      }

      const res = await fetch("/api/actions/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: actionUrl,
          method: actionMethod,
          authType: actionAuthType,
          authSecret: actionAuthSecret,
          payload: parsedPayload
        })
      });

      const data = await res.json();
      setActionTestResult(data);
    } catch (err: any) {
      setActionTestResult({
        url: actionUrl,
        method: actionMethod,
        status: 500,
        statusText: "Error de red",
        headers: {},
        data: err.message,
        durationMs: 0,
        success: false
      });
    } finally {
      setIsTestingAction(false);
    }
  };

  const handleSaveAppAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionName.trim() || !actionUrl.trim()) return;

    await onAddSolidarity({
      name: actionName.trim(),
      category: "Integración de Aplicaciones",
      type: "app_action",
      description: `Acción externa hacia ${actionMethod} ${actionUrl} para disparar cambios reales en tus aplicaciones.`,
      enabled: true,
      endpointUrl: actionUrl.trim(),
      method: actionMethod,
      authType: actionAuthType,
      authSecret: actionAuthSecret,
      samplePayload: actionPayload,
      isTestbenchDemo: false,
      tags: ["Acción", "Webhook", "App Propia"]
    });

    setIsActionModalOpen(false);
    setActionName("");
  };

  // Handle Save MPC
  const handleSaveMpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpcName.trim() || !mpcEndpoint.trim()) return;

    const tools = mpcToolsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await onAddSolidarity({
      name: mpcName.trim(),
      category: "Protocolos MPC",
      type: "mcp_server",
      description: `Servidor de Model Context Protocol (MPC) en ${mpcEndpoint} con ${tools.length} capacidades registradas.`,
      enabled: true,
      endpointUrl: mpcEndpoint.trim(),
      mcpProtocol: "json-rpc-2.0",
      mcpToolsProvided: tools,
      isTestbenchDemo: false,
      tags: ["MPC", "JSON-RPC", "Protocolo"]
    });

    setIsMpcModalOpen(false);
    setMpcName("");
  };

  // Filtered list
  const filteredSolidarities = solidarities.filter((item) => {
    const matchesType =
      filterType === "all"
        ? true
        : filterType === "demo"
        ? item.isTestbenchDemo
        : filterType === "production"
        ? !item.isTestbenchDemo
        : item.type === filterType;

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Explanation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                Lista de Solidaridades (Catálogo Abierto de Herramientas & Conectores)
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Aquí gestionas todas las capacidades activas del sistema. Las pruebas científicas
              (MORPH / HBAG) son <strong>bancos de demostración (Testbench)</strong> para ilustrar
              límites computacionales; mientras que el sistema está <strong>completamente libre</strong> para
              conectar cualquier <strong>API externa, SDK, servidores MPC</strong>, ejecutar <strong>acciones
              en tus propias aplicaciones</strong> o <strong>clonar herramientas directamente desde GitHub</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-open-clone-github"
              onClick={() => setIsCloneModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              <span>Clonar desde GitHub</span>
            </button>

            <button
              id="btn-open-add-action"
              onClick={() => setIsActionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>Conectar API / Acción en tu App</span>
            </button>

            <button
              id="btn-open-add-mpc"
              onClick={() => setIsMpcModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <Radio className="w-4 h-4 text-purple-600" />
              <span>Conectar Servidor MPC</span>
            </button>
          </div>
        </div>

        {/* Filters & Quick Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: "all", label: `Todas (${solidarities.length})` },
              { id: "production", label: "Libre Implementación (APIs / Git / MPC)" },
              { id: "demo", label: "Testbench Científico (Demo)" },
              { id: "github_repo", label: "Repositorios GitHub" },
              { id: "app_action", label: "Acciones en Apps" },
              { id: "mcp_server", label: "Protocolos MPC" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  filterType === f.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Filtrar solidaridades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Solidarities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSolidarities.map((item) => {
          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 space-y-3.5 flex flex-col justify-between transition-all ${
                item.enabled
                  ? "border-slate-200 shadow-2xs"
                  : "border-slate-200/60 bg-slate-50/50 opacity-75"
              }`}
            >
              <div className="space-y-3">
                {/* Header with Type & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === "github_repo" && (
                      <div className="p-2 bg-slate-900 text-emerald-400 rounded-xl">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === "app_action" && (
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                        <Globe className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === "mcp_server" && (
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                        <Radio className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === "sdk_connector" && (
                      <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl">
                        <FileCode2 className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === "deterministic_testbench" && (
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                        <FlaskConical className="w-4 h-4" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {item.name}
                      </h3>
                      <span className="text-[10px] text-slate-500">{item.category}</span>
                    </div>
                  </div>

                  {/* Testbench vs Open Production Badge */}
                  {item.isTestbenchDemo ? (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Testbench Demo
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                      Libre / Prod
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                {/* Specific Details based on tool type */}
                {item.repoUrl && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Repositorio Clonado:</span>
                      <span className="text-emerald-700 font-bold">git: {item.branch || "main"}</span>
                    </div>
                    <div className="truncate text-indigo-600 font-semibold">{item.repoUrl}</div>
                  </div>
                )}

                {item.endpointUrl && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>Endpoint Conectado:</span>
                      <span className="font-bold text-slate-900">{item.method || "POST"}</span>
                    </div>
                    <div className="truncate text-slate-800">{item.endpointUrl}</div>
                  </div>
                )}

                {item.mcpToolsProvided && item.mcpToolsProvided.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Capacidades MPC:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.mcpToolsProvided.map((tool) => (
                        <span
                          key={tool}
                          className="bg-purple-50 text-purple-700 text-[10px] font-mono px-2 py-0.5 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags?.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => onToggleSolidarity(item.id, e.target.checked)}
                    className="w-3.5 h-3.5 accent-indigo-600 rounded"
                  />
                  <span>{item.enabled ? "Activa" : "Desactivada"}</span>
                </label>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDeleteSolidarity(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar de la lista de solidaridades"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Clonar desde GitHub */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Clonar Herramienta desde GitHub
                </h3>
              </div>
              <button
                onClick={() => setIsCloneModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGitClone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL del Repositorio de GitHub *
                </label>
                <input
                  id="github-clone-url-input"
                  type="url"
                  required
                  placeholder="https://github.com/usuario/repositorio.git"
                  value={cloneRepoUrl}
                  onChange={(e) => setCloneRepoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Se clonará en el directorio local <code>./solidarities/</code> del servidor.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rama (Branch)</label>
                  <input
                    type="text"
                    value={cloneBranch}
                    onChange={(e) => setCloneBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Personalizado
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional (se infiere del repo)"
                    value={cloneCustomName}
                    onChange={(e) => setCloneCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Propósito
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe qué funciones o utilidades provee este repositorio a la flota de agentes..."
                  value={cloneDescription}
                  onChange={(e) => setCloneDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              {/* Status / Log message */}
              {cloneResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono whitespace-pre-wrap ${
                    cloneResult.error
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {cloneResult.error
                    ? `Error: ${cloneResult.error}`
                    : `Repositorio clonado con éxito en: ${cloneResult.clonedPath} (${cloneResult.filesCount} archivos detectados)`}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-clone-git"
                  type="submit"
                  disabled={isCloning}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>{isCloning ? "Clonando repositorio..." : "Clonar Repositorio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conectar Acción en mi Aplicación / API */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Conectar Acción en tu Aplicación (Webhook / API)
                </h3>
              </div>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAppAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Acción *
                </label>
                <input
                  id="action-name-input"
                  type="text"
                  required
                  placeholder="Ej: Notificar Despliegue en Slack / Actualizar Base de Datos"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Método</label>
                  <select
                    value={actionMethod}
                    onChange={(e) => setActionMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL de Destino (Endpoint de tu App) *
                  </label>
                  <input
                    id="action-url-input"
                    type="url"
                    required
                    placeholder="https://api.tu-app.com/v1/actions"
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Autenticación
                  </label>
                  <select
                    value={actionAuthType}
                    onChange={(e) => setActionAuthType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="none">Sin Autenticación (Público)</option>
                    <option value="bearer">Bearer Token (Header Authorization)</option>
                    <option value="api_key">API Key (Header x-api-key)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Token o Secreto
                  </label>
                  <input
                    type="password"
                    placeholder="sk_..."
                    value={actionAuthSecret}
                    onChange={(e) => setActionAuthSecret(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Carga Útil de Prueba (Payload JSON)
                </label>
                <textarea
                  rows={3}
                  value={actionPayload}
                  onChange={(e) => setActionPayload(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden font-mono"
                />
              </div>

              {/* Live Test Action Button & Result */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Probar Despacho Real Inmediato
                  </span>
                  <button
                    type="button"
                    onClick={handleTestAppAction}
                    disabled={isTestingAction}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isTestingAction ? "Despachando..." : "Enviar Petición de Prueba"}</span>
                  </button>
                </div>

                {actionTestResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-mono space-y-1 ${
                      actionTestResult.success
                        ? "bg-emerald-100/70 text-emerald-900 border border-emerald-300"
                        : "bg-rose-100/70 text-rose-900 border border-rose-300"
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Status: {actionTestResult.status} {actionTestResult.statusText}</span>
                      <span>{actionTestResult.durationMs} ms</span>
                    </div>
                    <div className="truncate max-h-20 overflow-y-auto">
                      {typeof actionTestResult.data === "object"
                        ? JSON.stringify(actionTestResult.data)
                        : String(actionTestResult.data)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
                >
                  Guardar Solidaridad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conectar Servidor MPC */}
      {isMpcModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Conectar Servidor MPC (Model Context Protocol)
                </h3>
              </div>
              <button
                onClick={() => setIsMpcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMpc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Servidor MPC *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Servidor Local de Archivos y BD"
                  value={mpcName}
                  onChange={(e) => setMpcName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endpoint URL del Servidor MPC *
                </label>
                <input
                  type="text"
                  required
                  placeholder="http://localhost:3000/api/mcp"
                  value={mpcEndpoint}
                  onChange={(e) => setMpcEndpoint(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Herramientas y Capacidades Provistas (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="fs_read, fs_write, sql_query, web_search"
                  value={mpcToolsInput}
                  onChange={(e) => setMpcToolsInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMpcModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-all"
                >
                  Registrar Servidor MPC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
