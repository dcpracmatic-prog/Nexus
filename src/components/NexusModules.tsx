import React, { useMemo, useState } from "react";
import { Boxes, FileText, FlaskConical, GitBranch, Image as ImageIcon, LayoutDashboard, Lock, Plus, Eye, ShieldCheck, Trash2, Upload, Wand2 } from "lucide-react";
import { NexusVision, NexusVisionState } from "./NexusVision";
import { NexusExitGate } from "./NexusExitGate";
import type { ExitEvaluation } from "../../runtime/vision";
import type { ExitReport } from "../../runtime/release/analyzer";

export type NexusModule = "create" | "analyze" | "experiment" | "resources" | "management" | "render";

export interface NexusConnection { id: string; source: string; target: string; intent: string; operations: string[]; enabled: boolean; }
export interface NexusResource { id: string; name: string; type: string; description?: string; sharedWith?: string[]; }

interface Props {
  active: NexusModule;
  setActive: (module: NexusModule) => void;
  resources: NexusResource[];
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
  create: { label: "Crear", description: "Construye una pieza a partir de una intención explícita." },
  analyze: { label: "Analizar", description: "Observa recursos compartidos sin asumir autoridad de modificación." },
  experiment: { label: "Experimentar", description: "Prueba cambios dentro de un estado mutable y descartable." },
  resources: { label: "Recursos", description: "Administra qué información existe y qué puede compartir cada módulo." },
  management: { label: "Management", description: "Define relaciones, intención, alcance y reglas entre piezas." },
  render: { label: "Render", description: "Observa el comportamiento y prepara la salida, sin publicar automáticamente." }
};

const ModuleTabs: React.FC<Props> = ({ active, setActive }) => <div className="flex gap-2 overflow-x-auto pb-1">{(Object.keys(moduleMeta) as NexusModule[]).map(key => { const Icon = key === "create" ? Plus : key === "analyze" ? Eye : key === "experiment" ? FlaskConical : key === "resources" ? Boxes : key === "management" ? GitBranch : LayoutDashboard; return <button key={key} onClick={() => setActive(key)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${active === key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}><Icon className="w-4 h-4" />{moduleMeta[key].label}</button>; })}</div>;

const ShareSelector: React.FC<{ module: NexusModule; resources: NexusResource[]; shared: string[]; onToggle: (id: string) => void }> = ({ module, resources, shared, onToggle }) => <section className="bg-white border border-slate-200 rounded-2xl p-4"><div className="flex items-center justify-between mb-3"><div><h3 className="font-bold text-sm">Información disponible para {moduleMeta[module].label}</h3><p className="text-xs text-slate-500">El usuario selecciona qué recursos entran al contexto de esta pestaña.</p></div><ShieldCheck className="w-5 h-5 text-slate-400" /></div><div className="grid gap-2">{resources.map(r => <button key={r.id} onClick={() => onToggle(r.id)} className={`text-left border rounded-xl p-3 transition ${shared.includes(r.id) ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-slate-50"}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold">{r.name}</span><span className="text-[10px] uppercase font-mono">{r.type}</span></div><p className="text-xs text-slate-500 mt-1">{r.description || "Recurso del proyecto"}</p></button>)}</div></section>;

const WorkImporter: React.FC<{ module: NexusModule; imported?: { name: string; content: string }; onImported: (value: { name: string; content: string }) => void }> = ({ module, imported, onImported }) => {
  const load = async (file: File) => onImported({ name: file.name, content: await file.text() });
  return <section className="bg-white border border-slate-200 rounded-2xl p-4"><div className="flex items-center justify-between"><div><h3 className="font-bold text-sm">Entrada explícita a {moduleMeta[module].label}</h3><p className="text-xs text-slate-500">Una pestaña sólo recibe el archivo que el usuario introduce aquí. No existe transferencia automática entre pestañas.</p></div><Upload className="w-4 h-4 text-slate-400" /></div><label className="mt-3 flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl p-3 text-xs font-bold cursor-pointer hover:bg-slate-50"><Upload className="w-4 h-4"/> {imported ? `Reemplazar ${imported.name}` : "Agregar trabajo / versión"}<input type="file" className="hidden" onChange={e => e.target.files?.[0] && load(e.target.files[0])}/></label>{imported && <div className="mt-3 text-[11px] bg-slate-50 rounded-xl p-3 font-mono break-all"><b>{imported.name}</b><div className="mt-1 text-slate-500">{imported.content.length} caracteres · contenido efímero de esta pestaña</div></div>}</section>;
};

export const NexusModules: React.FC<Props> = props => {
  const { active, resources, sharedByModule, onToggleShare, connections, onAddConnection, onDeleteConnection, onToggleConnection, vision, onVisionChange, declaredVision, exitEvaluation, userId, onDeclareVision } = props;
  const [intent, setIntent] = useState("");
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState(resources[0]?.id || "");
  const [previewType, setPreviewType] = useState("application");
  const [experimentNote, setExperimentNote] = useState("");
  const [imports, setImports] = useState<Record<string, { name: string; content: string } | undefined>>({});
  const selected = useMemo(() => resources.find(r => r.id === target), [resources, target]);

  const runLlama = async (mode: "create" | "analyze") => {
    if (!intent.trim() || running) return;
    setRunning(true); setAnswer("");
    try {
      const context = imports[mode]?.content ? `\n\nARCHIVO IMPORTADO EN ESTA PESTAÑA:\n${imports[mode]!.content.slice(0, 12000)}` : "";
      const request = mode === "create"
        ? `Actúa dentro de la pestaña CREAR de NEXUS. No tienes autoridad para publicar ni para usar recursos no autorizados. Interpreta esta intención, separa hechos, supuestos, faltantes, plan y pruebas: ${intent}${context}`
        : `Actúa dentro de la pestaña ANALIZAR de NEXUS. Sólo puedes observar el contexto entregado. Produce hechos, inferencias, riesgos, faltantes y pruebas recomendadas: ${intent}${context}`;
      const r = await fetch("/api/llama/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: request }) });
      const data = await r.json();
      setAnswer(data.reply || data.error || "Sin respuesta.");
    } catch (e: any) { setAnswer(`No se pudo ejecutar LLaMA: ${e?.message || "error"}`); }
    finally { setRunning(false); }
  };

  return <div className="space-y-4">
    <div><h1 className="text-2xl font-black tracking-tight">NEXUS™</h1><p className="text-sm text-slate-500 mt-1">{moduleMeta[active].description}</p></div>
    <ModuleTabs {...props} />

    {(active === "create" || active === "analyze" || active === "experiment") && <WorkImporter module={active} imported={imports[active]} onImported={v => setImports(prev => ({ ...prev, [active]: v }))} />}

    {active === "create" && <div className="space-y-4"><NexusVision vision={vision} onChange={onVisionChange} /><div className="grid lg:grid-cols-2 gap-4"><section className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold mb-2">Prompt / intención</h2><p className="text-[11px] text-slate-500 mb-3">LLaMA interpreta. La autoridad permanece en NEXUS y en el usuario. La ejecución externa requiere capacidades autorizadas.</p><textarea value={intent} onChange={e => setIntent(e.target.value)} rows={6} className="w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Qué quieres hacer ahora…"/><button onClick={() => runLlama("create")} disabled={!intent.trim() || running} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-40"><Wand2 className="w-4 h-4"/>{running ? "Procesando…" : "Ejecutar prompt"}</button>{answer && <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-xs bg-slate-950 text-slate-100 rounded-xl p-4">{answer}</pre>}</section><ShareSelector module="create" resources={resources} shared={sharedByModule.create || []} onToggle={id => onToggleShare("create", id)} /></div></div>}

    {active === "analyze" && <div className="grid lg:grid-cols-2 gap-4"><section className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold mb-2">Consulta de análisis</h2><textarea value={intent} onChange={e => setIntent(e.target.value)} rows={6} className="w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Qué quieres comprobar o entender…"/><button onClick={() => runLlama("analyze")} disabled={!intent.trim() || running} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-40"><Wand2 className="w-4 h-4"/>{running ? "Analizando…" : "Analizar con LLaMA"}</button>{answer && <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-xs bg-slate-950 text-slate-100 rounded-xl p-4">{answer}</pre>}</section><ShareSelector module="analyze" resources={resources} shared={sharedByModule.analyze || []} onToggle={id => onToggleShare("analyze", id)} /></div>}

    {active === "experiment" && <div className="grid lg:grid-cols-2 gap-4"><section className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-2"><FlaskConical className="w-5 h-5"/><h2 className="font-bold">Experimento efímero</h2></div><p className="text-xs text-slate-500 mt-2">El estado mutable vive en esta sesión. Guardar una versión requiere una acción explícita del usuario.</p><div className="mt-4 grid grid-cols-2 gap-2 text-xs">{["baseline", "candidate", "tests", "metrics", "patches", "logs"].map(x => <div key={x} className="border border-slate-200 rounded-xl p-3 font-mono">{x}/</div>)}</div><textarea value={experimentNote} onChange={e => setExperimentNote(e.target.value)} rows={4} className="mt-4 w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Describe el experimento o la variante…"/><button onClick={() => setAnswer(`Experimento efímero creado en memoria para esta pestaña.\n\n${experimentNote || "Sin descripción."}`)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Crear experimento</button>{answer && <pre className="mt-3 whitespace-pre-wrap text-xs bg-slate-950 text-slate-100 rounded-xl p-4">{answer}</pre>}</section><ShareSelector module="experiment" resources={resources} shared={sharedByModule.experiment || []} onToggle={id => onToggleShare("experiment", id)} /></div>}

    {active === "resources" && <div className="grid gap-3">{resources.map(r => <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 bg-slate-100 rounded-xl"><FileText className="w-4 h-4"/></div><div><div className="font-bold text-sm">{r.name}</div><div className="text-xs text-slate-500">{r.type} · {r.id}</div></div></div><span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded">Disponible para importación explícita</span></div>)}</div>}

    {active === "management" && <section className="bg-white border border-slate-200 rounded-2xl p-5"><div className="flex items-center gap-3 mb-4"><GitBranch className="w-5 h-5"/><div><h2 className="font-bold">Management de relaciones</h2><p className="text-xs text-slate-500">La relación se registra como decisión del usuario; no crea comunicación autónoma entre pestañas.</p></div></div><div className="grid gap-3">{connections.map(c => <div key={c.id} className="border border-slate-200 rounded-xl p-4"><div className="flex items-center justify-between"><div className="text-sm font-mono font-bold">{c.source} → {c.target}</div><div className="flex items-center gap-2"><span className={`text-[10px] px-2 py-1 rounded ${c.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.enabled ? "ACTIVA" : "PAUSADA"}</span><button onClick={() => onToggleConnection(c.id)} title="Activar/pausar" className="p-1.5 rounded-lg hover:bg-slate-100"><ShieldCheck className="w-4 h-4"/></button><button onClick={() => onDeleteConnection(c.id)} title="Eliminar" className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4"/></button></div></div><div className="text-xs text-slate-600 mt-2"><b>Intención:</b> {c.intent || "No definida"}</div><div className="text-[11px] text-slate-500 mt-1"><b>Operaciones:</b> {c.operations.join(", ") || "ninguna"}</div></div>)}{connections.length === 0 && <div className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl p-6 text-center">No hay conexiones. NEXUS no inventa autoridad entre recursos.</div>}</div><button onClick={() => { if (resources.length >= 2) onAddConnection({ id: `rel-${Date.now()}`, source: resources[0].id, target: resources[1].id, intent: "Conexión definida explícitamente por el usuario", operations: ["READ"], enabled: true }); }} disabled={resources.length < 2} className="mt-4 flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-sm font-bold disabled:opacity-40"><Plus className="w-4 h-4"/> Nueva relación</button></section>}

    {active === "render" && <div className="space-y-4"><div className="grid lg:grid-cols-[280px_1fr] gap-4"><section className="bg-white border border-slate-200 rounded-2xl p-4"><h2 className="font-bold text-sm">Preview</h2><select value={target} onChange={e => setTarget(e.target.value)} className="mt-3 w-full border border-slate-200 rounded-xl p-2 text-sm">{resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select><label className="block text-xs font-semibold mt-4">Modo</label><select value={previewType} onChange={e => setPreviewType(e.target.value)} className="mt-2 w-full border border-slate-200 rounded-xl p-2 text-sm"><option value="application">Aplicación</option><option value="api">API</option><option value="document">Documento</option><option value="library">Librería/SDK</option><option value="data">Datos</option></select><div className="mt-4 text-[11px] text-slate-500 flex gap-2"><Lock className="w-4 h-4"/> Render no publica.</div></section><section className="bg-slate-950 rounded-2xl min-h-[320px] p-5 text-slate-100"><div className="flex items-center justify-between border-b border-slate-800 pb-3"><div><div className="font-bold">Preview: {selected?.name || "Sin artefacto"}</div><div className="text-[11px] text-slate-500">{previewType} · sandbox conceptual</div></div><ImageIcon className="w-5 h-5 text-slate-500"/></div><div className="h-[230px] flex items-center justify-center text-center"><div><div className="text-lg font-bold">Render controlado</div><p className="text-xs text-slate-500 mt-1">La salida externa está separada de la vista previa.</p></div></div></section></div><NexusExitGate workspaceContext={vision} declaredVision={declaredVision} evaluation={exitEvaluation} userId={userId} importedArtifact={imports.render} onDeclare={onDeclareVision}/></div>}
  </div>;
};
