import React, { useEffect, useMemo, useState } from "react";
import {
  Boxes, Download, FileText, FlaskConical, GitBranch, Image as ImageIcon,
  LayoutDashboard, Lock, Plus, Eye, ShieldCheck, Trash2, Upload, Wand2, Save, Link2
} from "lucide-react";
import { NexusVision, NexusVisionState } from "./NexusVision";
import { NexusExitGate } from "./NexusExitGate";
import type { ExitEvaluation } from "../../runtime/vision";
import type { ExitReport } from "../../runtime/release/analyzer";
import { analyzeArtifactLocally, type LocalArtifactAnalysis } from "../lib/localAnalysis";
import { createExplicitTransfer } from "../../runtime/isolation";

export type NexusModule = "create" | "analyze" | "experiment" | "resources" | "management" | "render";

export interface NexusConnection {
  id: string;
  source: string;
  target: string;
  intent: string;
  operations: string[];
  enabled: boolean;
  fromModule?: string;
  toModule?: string;
}

export interface NexusResource {
  id: string;
  name: string;
  type: string;
  description?: string;
  content?: string;
  format?: "markdown" | "json" | "text" | "code";
  createdAt?: string;
  updatedAt?: string;
  sharedWith?: string[];
}

interface Props {
  active: NexusModule;
  setActive: (module: NexusModule) => void;
  resources: NexusResource[];
  onUpsertResource: (resource: NexusResource) => void;
  onDeleteResource: (id: string) => void;
  sharedByModule: Record<string, string[]>;
  onToggleShare: (module: NexusModule, resourceId: string) => void;
  connections: NexusConnection[];
  onAddConnection: (connection: NexusConnection) => void;
  onDeleteConnection: (id: string) => void;
  onToggleConnection: (id: string) => void;
  vision: NexusVisionState;
  onVisionChange: (vision: NexusVisionState) => void;
  declaredVision: NexusVisionState;
  exitEvaluation?: ExitEvaluation;
  userId: string;
  allowExternalPublish: boolean;
  onDeclareVision: (vision: NexusVisionState, evaluation: ExitEvaluation, report?: ExitReport) => void;
}

const moduleMeta: Record<NexusModule, { label: string; description: string }> = {
  create: { label: "Crear", description: "Escribe intención + contenido y guarda un artefacto nombrado." },
  analyze: { label: "Analizar", description: "Análisis determinista del artefacto seleccionado (Ollama opcional)." },
  experiment: { label: "Experimentar", description: "Prueba cambios en estado efímero; persistir requiere acción explícita." },
  resources: { label: "Recursos", description: "Lista artefactos del almacén in-app y permite descarga." },
  management: { label: "Management", description: "Conecta módulos vía TAB A → USUARIO → TAB B (sin transferencia automática)." },
  render: { label: "Render", description: "Vista previa + Exit Gate: visión final, evidencia y descarga READY." }
};

function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const ModuleTabs: React.FC<Props> = ({ active, setActive }) => (
  <div className="flex gap-2 overflow-x-auto pb-1">
    {(Object.keys(moduleMeta) as NexusModule[]).map((key) => {
      const Icon =
        key === "create" ? Plus :
        key === "analyze" ? Eye :
        key === "experiment" ? FlaskConical :
        key === "resources" ? Boxes :
        key === "management" ? GitBranch :
        LayoutDashboard;
      return (
        <button
          key={key}
          onClick={() => setActive(key)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${
            active === key
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          <Icon className="w-4 h-4" />
          {moduleMeta[key].label}
        </button>
      );
    })}
  </div>
);

const ShareSelector: React.FC<{
  module: NexusModule;
  resources: NexusResource[];
  shared: string[];
  onToggle: (id: string) => void;
}> = ({ module, resources, shared, onToggle }) => (
  <section className="bg-white border border-slate-200 rounded-2xl p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="font-bold text-sm">Compartir con {moduleMeta[module].label}</h3>
        <p className="text-xs text-slate-500">
          El usuario elige qué recursos entran al contexto. No hay puente automático entre pestañas.
        </p>
      </div>
      <ShieldCheck className="w-5 h-5 text-slate-400" />
    </div>
    <div className="grid gap-2">
      {resources.map((r) => (
        <button
          key={r.id}
          onClick={() => onToggle(r.id)}
          className={`text-left border rounded-xl p-3 transition ${
            shared.includes(r.id) ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{r.name}</span>
            <span className="text-[10px] uppercase font-mono">{r.format || r.type}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {r.content != null && r.content.length > 0
              ? `${r.content.length} caracteres`
              : r.description || "Sin contenido aún"}
          </p>
        </button>
      ))}
      {resources.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">No hay recursos. Crea uno en Crear.</p>
      )}
    </div>
  </section>
);

export const NexusModules: React.FC<Props> = (props) => {
  const {
    active, setActive, resources, onUpsertResource, onDeleteResource,
    sharedByModule, onToggleShare, connections, onAddConnection, onDeleteConnection,
    onToggleConnection, vision, onVisionChange, declaredVision, exitEvaluation,
    userId, onDeclareVision
  } = props;

  const [intent, setIntent] = useState("");
  const [content, setContent] = useState("");
  const [artifactName, setArtifactName] = useState("mvp.md");
  const [artifactFormat, setArtifactFormat] = useState<"markdown" | "json" | "text" | "code">("markdown");
  const [saveMsg, setSaveMsg] = useState("");
  const [running, setRunning] = useState(false);
  const [llamaNote, setLlamaNote] = useState("");
  const [analyzeId, setAnalyzeId] = useState("");
  const [analysis, setAnalysis] = useState<LocalArtifactAnalysis | null>(null);
  const [experimentNote, setExperimentNote] = useState("");
  const [experimentResult, setExperimentResult] = useState("");
  const [renderTarget, setRenderTarget] = useState("");
  const [previewType, setPreviewType] = useState("document");
  const [connFrom, setConnFrom] = useState<NexusModule>("create");
  const [connTo, setConnTo] = useState<NexusModule>("analyze");
  const [connResource, setConnResource] = useState("");
  const [connIntent, setConnIntent] = useState("Transferencia explícita TAB A → USUARIO → TAB B");

  const withContent = useMemo(
    () => resources.filter((r) => r.content != null && r.content.length > 0),
    [resources]
  );

  useEffect(() => {
    if (!analyzeId && withContent[0]) setAnalyzeId(withContent[0].id);
  }, [withContent, analyzeId]);

  useEffect(() => {
    if (!renderTarget && withContent[0]) setRenderTarget(withContent[0].id);
  }, [withContent, renderTarget]);

  useEffect(() => {
    if (!connResource && withContent[0]) setConnResource(withContent[0].id);
  }, [withContent, connResource]);

  const selectedAnalyze = resources.find((r) => r.id === analyzeId);
  const selectedRender = resources.find((r) => r.id === renderTarget);

  const saveArtifact = () => {
    setSaveMsg("");
    const name = artifactName.trim() || "artifact.md";
    const body = content.trim();
    if (!body) {
      setSaveMsg("Pega o escribe contenido antes de guardar.");
      return;
    }
    const id = `art-${Date.now()}`;
    const now = new Date().toISOString();
    const resource: NexusResource = {
      id,
      name,
      type: artifactFormat === "json" ? "json" : artifactFormat === "code" ? "code" : "document",
      format: artifactFormat,
      description: intent.trim() || `Creado en CREATE · ${now}`,
      content: content,
      createdAt: now,
      updatedAt: now
    };
    onUpsertResource(resource);
    onToggleShare("create", id);
    setSaveMsg(`Guardado: ${name} (${body.length} caracteres). Disponible en Recursos.`);
    setAnalyzeId(id);
    setRenderTarget(id);
  };

  const downloadCurrentDraft = () => {
    const name = artifactName.trim() || "artifact.md";
    const mime =
      artifactFormat === "json" ? "application/json;charset=utf-8" :
      artifactFormat === "markdown" ? "text/markdown;charset=utf-8" :
      "text/plain;charset=utf-8";
    downloadText(name, content, mime);
  };

  const runDeterministicAnalyze = () => {
    if (!selectedAnalyze?.content) {
      setAnalysis(null);
      setLlamaNote("Selecciona un artefacto con contenido (créalo en Crear o compártelo aquí).");
      return;
    }
    const result = analyzeArtifactLocally(selectedAnalyze.name, selectedAnalyze.content);
    setAnalysis(result);
    setLlamaNote("");
  };

  const runOptionalLlama = async () => {
    if (!selectedAnalyze?.content || running) return;
    setRunning(true);
    setLlamaNote("");
    try {
      const prompt =
        `Analiza este artefacto NEXUS (sólo observa). Separa HECHOS, RIESGOS, FALTANTES, PRUEBAS.\n` +
        `Nombre: ${selectedAnalyze.name}\n` +
        `Intención del usuario: ${intent || "(ninguna)"}\n\n` +
        selectedAnalyze.content.slice(0, 12000);
      const r = await fetch("/api/llama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await r.json();
      setLlamaNote(data.reply || data.error || "Sin respuesta.");
    } catch (e: any) {
      setLlamaNote(`Ollama no disponible (opcional): ${e?.message || "error"}`);
    } finally {
      setRunning(false);
    }
  };

  const promoteExperiment = () => {
    const note = experimentNote.trim();
    if (!note) {
      setExperimentResult("Describe la variante antes de promoverla a recurso.");
      return;
    }
    const now = new Date().toISOString();
    const id = `exp-${Date.now()}`;
    onUpsertResource({
      id,
      name: `experimento-${id.slice(-6)}.md`,
      type: "document",
      format: "markdown",
      description: "Promovido explícitamente desde Experimentar",
      content: `# Experimento\n\n${note}\n`,
      createdAt: now,
      updatedAt: now
    });
    onToggleShare("experiment", id);
    setExperimentResult(`Experimento promovido a Recursos (${id}). El estado efímero no se guarda solo.`);
  };

  const addModuleBridge = () => {
    if (connFrom === connTo) return;
    const res = resources.find((r) => r.id === connResource);
    if (!res?.content) return;
    const transfer = createExplicitTransfer(connFrom, connTo, res.name, res.content);
    onAddConnection({
      id: transfer.transferId,
      source: connFrom,
      target: connTo,
      intent: connIntent || `Usuario transfiere ${res.name}`,
      operations: ["READ"],
      enabled: true,
      fromModule: connFrom,
      toModule: connTo
    });
    // Explicit share into destination tab (USER is the bridge)
    if (!(sharedByModule[connTo] || []).includes(res.id)) {
      onToggleShare(connTo, res.id);
    }
  };

  const exitArtifact = selectedRender?.content
    ? { name: selectedRender.name, content: selectedRender.content }
    : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight">NEXUS™</h1>
        <p className="text-sm text-slate-500 mt-1">{moduleMeta[active].description}</p>
      </div>
      <ModuleTabs {...props} />

      {active === "create" && (
        <div className="space-y-4">
          <NexusVision vision={vision} onChange={onVisionChange} />
          <div className="grid lg:grid-cols-2 gap-4">
            <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="font-bold">Crear artefacto</h2>
              <p className="text-[11px] text-slate-500">
                Escribe intención y contenido. Guardar lo persiste en el almacén in-app (localStorage).
                Ollama es opcional y no tiene autoridad.
              </p>
              <label className="block text-xs font-bold">Nombre del artefacto</label>
              <div className="flex gap-2">
                <input
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  placeholder="mvp.md"
                />
                <select
                  value={artifactFormat}
                  onChange={(e) => setArtifactFormat(e.target.value as any)}
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="text">Texto</option>
                  <option value="code">Código</option>
                </select>
              </div>
              <label className="block text-xs font-bold">Intención</label>
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm"
                placeholder="Qué debe hacer este artefacto…"
              />
              <label className="block text-xs font-bold">Contenido</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono"
                placeholder={"# Mi MVP\n\nDescripción del producto…"}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={saveArtifact}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
                >
                  <Save className="w-4 h-4" /> Guardar en Recursos
                </button>
                <button
                  onClick={downloadCurrentDraft}
                  disabled={!content.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> Descargar borrador
                </button>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50">
                  <Upload className="w-4 h-4" /> Pegar desde archivo
                  <input
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setArtifactName(f.name);
                      setContent(await f.text());
                      const lower = f.name.toLowerCase();
                      if (lower.endsWith(".json")) setArtifactFormat("json");
                      else if (lower.endsWith(".md")) setArtifactFormat("markdown");
                      else if (/\.(ts|js|py)$/.test(lower)) setArtifactFormat("code");
                      else setArtifactFormat("text");
                    }}
                  />
                </label>
              </div>
              {saveMsg && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{saveMsg}</p>}
            </section>
            <ShareSelector
              module="create"
              resources={resources}
              shared={sharedByModule.create || []}
              onToggle={(id) => onToggleShare("create", id)}
            />
          </div>
        </div>
      )}

      {active === "analyze" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-bold">Análisis determinista</h2>
            <p className="text-[11px] text-slate-500">
              Sin LLM: tamaño, estructura, riesgos e invariantes. Misma base de evidencia que el Exit Gate.
            </p>
            <label className="block text-xs font-bold">Artefacto</label>
            <select
              value={analyzeId}
              onChange={(e) => setAnalyzeId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-2 text-sm"
            >
              <option value="">— seleccionar —</option>
              {withContent.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.content!.length} chars)
                </option>
              ))}
            </select>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm"
              placeholder="Pregunta opcional para el refuerzo Ollama…"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={runDeterministicAnalyze}
                disabled={!selectedAnalyze?.content}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-40"
              >
                <Eye className="w-4 h-4" /> Analizar (local)
              </button>
              <button
                onClick={runOptionalLlama}
                disabled={!selectedAnalyze?.content || running}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold disabled:opacity-40"
              >
                <Wand2 className="w-4 h-4" /> {running ? "Ollama…" : "Refuerzo Ollama (opcional)"}
              </button>
            </div>
            {analysis && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <div className="font-bold text-sm">{analysis.summary}</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border rounded-lg p-2"><b>Bytes</b><div className="font-mono">{analysis.sizeBytes}</div></div>
                  <div className="border rounded-lg p-2"><b>Líneas</b><div className="font-mono">{analysis.lineCount}</div></div>
                  <div className="border rounded-lg p-2"><b>Formato</b><div className="font-mono">{analysis.format}</div></div>
                </div>
                <div>
                  <b>Estructura</b>
                  <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(analysis.structure, null, 2)}
                  </pre>
                </div>
                <div>
                  <b>Riesgos</b>
                  <ul className="mt-1 list-disc pl-4">
                    {analysis.risks.length ? analysis.risks.map((r, i) => <li key={i}>{r}</li>) : <li>Ninguno detectado por señales estáticas.</li>}
                  </ul>
                </div>
                <div>
                  <b>Invariantes</b>
                  <ul className="mt-1 list-disc pl-4">
                    {analysis.invariants.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
                <p className="font-mono text-[10px] text-slate-400">FP {analysis.exitReport.contentFingerprint}</p>
              </div>
            )}
            {llamaNote && (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs bg-slate-950 text-slate-100 rounded-xl p-4">
                {llamaNote}
              </pre>
            )}
          </section>
          <ShareSelector
            module="analyze"
            resources={resources}
            shared={sharedByModule.analyze || []}
            onToggle={(id) => onToggleShare("analyze", id)}
          />
        </div>
      )}

      {active === "experiment" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" />
              <h2 className="font-bold">Experimento efímero</h2>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              El estado mutable vive en esta sesión. Promover a Recursos es una acción explícita del usuario.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {["baseline", "candidate", "tests", "metrics", "patches", "logs"].map((x) => (
                <div key={x} className="border border-slate-200 rounded-xl p-3 font-mono">{x}/</div>
              ))}
            </div>
            <textarea
              value={experimentNote}
              onChange={(e) => setExperimentNote(e.target.value)}
              rows={4}
              className="mt-4 w-full border border-slate-200 rounded-xl p-3 text-sm"
              placeholder="Describe el experimento o la variante…"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setExperimentResult(
                    `Experimento en memoria (efímero).\n\n${experimentNote || "Sin descripción."}`
                  )
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
              >
                Crear en memoria
              </button>
              <button
                onClick={promoteExperiment}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold"
              >
                Promover a Recursos
              </button>
            </div>
            {experimentResult && (
              <pre className="mt-3 whitespace-pre-wrap text-xs bg-slate-950 text-slate-100 rounded-xl p-4">
                {experimentResult}
              </pre>
            )}
          </section>
          <ShareSelector
            module="experiment"
            resources={resources}
            shared={sharedByModule.experiment || []}
            onToggle={(id) => onToggleShare("experiment", id)}
          />
        </div>
      )}

      {active === "resources" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Almacén in-app (localStorage). Compartir a un módulo se hace en cada pestaña o vía Management.
          </p>
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-100 rounded-xl shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{r.name}</div>
                  <div className="text-xs text-slate-500">
                    {r.type} · {r.format || "—"} · {r.id}
                    {r.content != null ? ` · ${r.content.length} chars` : " · sin contenido"}
                  </div>
                  {r.description && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{r.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.content != null && r.content.length > 0 && (
                  <button
                    onClick={() =>
                      downloadText(
                        r.name,
                        r.content!,
                        r.format === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8"
                      )
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-xl text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </button>
                )}
                <button
                  onClick={() => onDeleteResource(r.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl p-6 text-center">
              Vacío. Crea un artefacto en la pestaña Crear.
            </div>
          )}
        </div>
      )}

      {active === "management" && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5" />
            <div>
              <h2 className="font-bold">Management de relaciones</h2>
              <p className="text-xs text-slate-500">
                Patrón: <span className="font-mono">TAB A → USUARIO → TAB B</span>. NEXUS no inventa autoridad entre pestañas.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
            <select value={connFrom} onChange={(e) => setConnFrom(e.target.value as NexusModule)} className="border rounded-xl px-3 py-2 text-sm">
              {(Object.keys(moduleMeta) as NexusModule[]).map((m) => (
                <option key={m} value={m}>Desde: {moduleMeta[m].label}</option>
              ))}
            </select>
            <select value={connTo} onChange={(e) => setConnTo(e.target.value as NexusModule)} className="border rounded-xl px-3 py-2 text-sm">
              {(Object.keys(moduleMeta) as NexusModule[]).map((m) => (
                <option key={m} value={m}>Hacia: {moduleMeta[m].label}</option>
              ))}
            </select>
            <select value={connResource} onChange={(e) => setConnResource(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
              <option value="">Artefacto…</option>
              {withContent.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              onClick={addModuleBridge}
              disabled={connFrom === connTo || !connResource}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-40"
            >
              <Link2 className="w-4 h-4" /> Conectar
            </button>
          </div>
          <input
            value={connIntent}
            onChange={(e) => setConnIntent(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="Intención de la relación"
          />

          <div className="grid gap-3">
            {connections.map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono font-bold">
                    {c.source} → {c.target}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded ${
                        c.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.enabled ? "ACTIVA" : "PAUSADA"}
                    </span>
                    <button onClick={() => onToggleConnection(c.id)} className="p-1.5 rounded-lg hover:bg-slate-100">
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteConnection(c.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  <b>Intención:</b> {c.intent || "No definida"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  <b>Operaciones:</b> {c.operations.join(", ") || "ninguna"} · iniciada por USUARIO
                </div>
              </div>
            ))}
            {connections.length === 0 && (
              <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl p-6 text-center">
                No hay conexiones. El usuario es el puente explícito entre módulos.
              </div>
            )}
          </div>
        </section>
      )}

      {active === "render" && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-[280px_1fr] gap-4">
            <section className="bg-white border border-slate-200 rounded-2xl p-4">
              <h2 className="font-bold text-sm">Preview / artefacto</h2>
              <select
                value={renderTarget}
                onChange={(e) => setRenderTarget(e.target.value)}
                className="mt-3 w-full border border-slate-200 rounded-xl p-2 text-sm"
              >
                <option value="">— seleccionar —</option>
                {withContent.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <label className="block text-xs font-semibold mt-4">Modo</label>
              <select
                value={previewType}
                onChange={(e) => setPreviewType(e.target.value)}
                className="mt-2 w-full border border-slate-200 rounded-xl p-2 text-sm"
              >
                <option value="document">Documento</option>
                <option value="application">Aplicación</option>
                <option value="api">API</option>
                <option value="library">Librería/SDK</option>
                <option value="data">Datos</option>
              </select>
              <div className="mt-4 text-[11px] text-slate-500 flex gap-2">
                <Lock className="w-4 h-4" /> Render no publica. La salida está en el Exit Gate abajo.
              </div>
            </section>
            <section className="bg-slate-950 rounded-2xl min-h-[280px] p-5 text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="font-bold">Preview: {selectedRender?.name || "Sin artefacto"}</div>
                  <div className="text-[11px] text-slate-500">
                    {previewType} · {selectedRender?.content?.length || 0} caracteres
                  </div>
                </div>
                <ImageIcon className="w-5 h-5 text-slate-500" />
              </div>
              <pre className="mt-3 max-h-[220px] overflow-auto text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                {selectedRender?.content
                  ? selectedRender.content.slice(0, 4000) + (selectedRender.content.length > 4000 ? "\n…" : "")
                  : "Selecciona un artefacto con contenido (créalo en Crear)."}
              </pre>
            </section>
          </div>
          <NexusExitGate
            workspaceContext={vision}
            declaredVision={declaredVision}
            evaluation={exitEvaluation}
            userId={userId}
            importedArtifact={exitArtifact}
            onDeclare={onDeclareVision}
          />
        </div>
      )}
    </div>
  );
};
