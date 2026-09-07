import React, { useMemo, useState } from "react";
import { CheckCircle2, Download, FileCode2, Lock, ShieldAlert, ShieldCheck, Upload, XCircle } from "lucide-react";
import { requestRelease } from "../../runtime/promotion/releaseGate";
import type { ExitEvaluation } from "../../runtime/vision";
import type { ReleaseResult } from "../../runtime/promotion/releaseGate";
import { analyzeExitArtifact, type ExitReport } from "../../runtime/release/analyzer";
import { NexusVisionState } from "./NexusVision";

interface Props {
  workspaceContext: NexusVisionState;
  declaredVision: NexusVisionState;
  evaluation?: ExitEvaluation;
  userId: string;
  importedArtifact?: { name: string; content: string };
  onDeclare: (vision: NexusVisionState, evaluation: ExitEvaluation, report?: ExitReport) => void;
}

export const NexusExitGate: React.FC<Props> = ({ workspaceContext, declaredVision, evaluation, userId, importedArtifact, onDeclare }) => {
  const [draft, setDraft] = useState(declaredVision.statement || "");
  const [artifactName, setArtifactName] = useState(importedArtifact?.name || "nexus-mvp.json");
  const [artifactText, setArtifactText] = useState(importedArtifact?.content || "");
  const [artifactKind, setArtifactKind] = useState<"code" | "document" | "mixed">("code");
  const [ackVision, setAckVision] = useState(false);
  const [ackTests, setAckTests] = useState(false);
  const [ackApproval, setAckApproval] = useState(false);
  const [report, setReport] = useState<ExitReport | undefined>(undefined);
  const [result, setResult] = useState<ReleaseResult | undefined>(undefined);
  const [error, setError] = useState("");

  const liveReport = useMemo(() => artifactText.trim() ? analyzeExitArtifact(artifactName, artifactText, artifactKind) : undefined, [artifactName, artifactText, artifactKind]);

  const loadFile = async (file: File) => {
    setError("");
    try {
      const text = await file.text();
      setArtifactName(file.name || "nexus-mvp.txt");
      setArtifactText(text);
      const lower = file.name.toLowerCase();
      setArtifactKind(lower.endsWith(".md") || lower.endsWith(".txt") ? "document" : "code");
    } catch (e: any) {
      setError(`No se pudo leer el archivo: ${e?.message || "error desconocido"}`);
    }
  };

  const evaluate = () => {
    setError("");
    const vision = { ...declaredVision, statement: draft.trim(), lastUpdated: new Date().toISOString() };
    if (!vision.statement) return setError("La visión final es obligatoria.");
    if (!artifactText.trim()) return setError("Carga o pega el MVP que quieres sacar de NEXUS.");
    if (!ackVision || !ackTests) return setError("Debes declarar la visión y confirmar la evidencia de pruebas antes de evaluar.");

    const analysis = analyzeExitArtifact(artifactName, artifactText, artifactKind);
    setReport(analysis);
    const release = requestRelease({
      userId,
      declaredVision: vision.statement,
      evidenceAvailable: analysis.evidence.missingEvidence.length === 0,
      testsPassed: ackTests,
      testEvidence: ["Usuario confirmó ejecución/verificación previa"],
      observedExcess: analysis.evidence.observedExcess,
      declaredSideEffects: analysis.evidence.sideEffects,
      scope: "artifact",
      hasExplicitUserApproval: ackApproval,
      promotionState: "PROMOTABLE",
      payload: artifactText,
      kind: artifactKind,
      documentContent: artifactText,
      artifactName,
      analysis
    });
    setResult(release);
    onDeclare(vision, release.exitEvaluation, analysis);
  };

  const download = () => {
    if (!result?.authorized || !result.artifact) return;
    const content = typeof result.artifact.content === "string" ? result.artifact.content : JSON.stringify(result.artifact.content, null, 2);
    const mime = artifactKind === "document" ? "text/plain;charset=utf-8" : "application/octet-stream";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifactName || "nexus-mvp";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);

    if (result.report) {
      const reportBlob = new Blob([JSON.stringify(result.report, null, 2)], { type: "application/json;charset=utf-8" });
      const reportUrl = URL.createObjectURL(reportBlob);
      const reportLink = document.createElement("a");
      reportLink.href = reportUrl;
      reportLink.download = `${artifactName}.nexus-report.json`;
      document.body.appendChild(reportLink);
      reportLink.click();
      reportLink.remove();
      setTimeout(() => URL.revokeObjectURL(reportUrl), 0);
    }
  };

  const status = result?.exitEvaluation || evaluation;

  return <section className="bg-white border-2 border-slate-300 rounded-2xl p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-slate-100"><Lock className="w-5 h-5" /></div>
        <div><h2 className="font-black text-lg">Salida / MVP</h2><p className="text-xs text-slate-500 mt-1 max-w-2xl">Sólo aquí se declara la visión final. NEXUS analiza el artefacto, reúne evidencia, revisa la Constitución y sólo después puede producir una salida sin cifrar.</p></div>
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-full"><ShieldCheck className="w-3 h-3"/> Usuario = autoridad</span>
    </div>

    <div className="grid lg:grid-cols-2 gap-4 mt-5">
      <div>
        <label className="block text-xs font-bold text-slate-700">Visión final</label>
        <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={7} className="mt-1.5 w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Qué debe hacer el MVP cuando salga de NEXUS…" />
        <label className="mt-3 flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={ackVision} onChange={e => setAckVision(e.target.checked)} className="mt-0.5"/> Confirmo que esta declaración representa mi intención final.</label>
        <label className="mt-2 flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={ackTests} onChange={e => setAckTests(e.target.checked)} className="mt-0.5"/> Confirmo que ejecuté/verifiqué el MVP y acepto usar esa evidencia para la evaluación.</label>
        <label className="mt-2 flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={ackApproval} onChange={e => setAckApproval(e.target.checked)} className="mt-0.5"/> Autorizo explícitamente a NEXUS a generar una salida externa si el gate resulta READY.</label>
      </div>

      <div>
        <div className="flex items-center gap-2"><FileCode2 className="w-4 h-4"/><h3 className="font-bold text-sm">Artefacto que se quiere sacar</h3></div>
        <div className="grid grid-cols-[1fr_auto] gap-2 mt-2">
          <input value={artifactName} onChange={e => setArtifactName(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="nombre-del-mvp" />
          <select value={artifactKind} onChange={e => setArtifactKind(e.target.value as any)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm"><option value="code">Código</option><option value="document">Documento</option><option value="mixed">Mixto</option></select>
        </div>
        <label className="mt-2 flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"><Upload className="w-4 h-4"/> Cargar archivo del MVP<input type="file" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} /></label>
        <textarea value={artifactText} onChange={e => setArtifactText(e.target.value)} rows={12} className="mt-2 w-full border border-slate-200 rounded-xl p-3 text-xs font-mono" placeholder="Pega aquí el contenido final o carga un archivo…" />
      </div>
    </div>

    {liveReport && <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50"><div className="flex items-center justify-between"><div className="font-bold text-sm">Informe automático V1</div><span className="text-[10px] font-mono">FP {liveReport.contentFingerprint}</span></div><p className="text-xs text-slate-600 mt-2">{liveReport.summary}</p><div className="grid md:grid-cols-3 gap-2 mt-3 text-xs"><div className="border border-slate-200 rounded-lg p-2"><b>Dependencias</b><div className="mt-1 font-mono break-all">{liveReport.evidence.dependencies.length || 0}</div></div><div className="border border-slate-200 rounded-lg p-2"><b>Side effects</b><div className="mt-1 font-mono">{liveReport.evidence.sideEffects.length || 0}</div></div><div className="border border-slate-200 rounded-lg p-2"><b>Red</b><div className="mt-1 font-mono">{liveReport.evidence.externalCalls.length || 0}</div></div></div></div>}

    {error && <div className="mt-4 flex items-center gap-2 text-xs text-rose-700 border border-rose-200 bg-rose-50 rounded-xl p-3"><XCircle className="w-4 h-4"/>{error}</div>}
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button onClick={evaluate} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Evaluar y pasar por Gate</button>
      {status && <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full ${status.status === "READY" ? "bg-emerald-50 text-emerald-700" : status.status === "BLOCKED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{status.status}</span>}
      {result?.authorized && <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Download className="w-4 h-4"/> Descargar MVP + informe</button>}
    </div>

    {status && <div className="mt-4 rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 font-bold text-sm">{status.status === "READY" ? <CheckCircle2 className="w-4 h-4 text-emerald-600"/> : <ShieldAlert className="w-4 h-4 text-amber-600"/>}{status.status}</div>{status.reasons.length > 0 && <ul className="mt-2 text-xs text-slate-600 space-y-1">{status.reasons.map((r,i)=><li key={i}>• {r}</li>)}</ul>}<p className="mt-3 text-[10px] font-mono text-slate-400">Constitución NEXUS {status.constitutionVersion}{report ? ` · Artefacto ${report.contentFingerprint}` : ""}</p></div>}
  </section>;
};
