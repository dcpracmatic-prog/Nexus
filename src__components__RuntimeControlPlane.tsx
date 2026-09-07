import React, { useState } from "react";
import { ShieldCheck, Play, AlertTriangle, CheckCircle2, Search, Lock, RotateCcw } from "lucide-react";

export const RuntimeControlPlane: React.FC = () => {
  const [request, setRequest] = useState("");
  const [assessment, setAssessment] = useState<any>(null);
  const [experiment, setExperiment] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const assess = async () => {
    if (!request.trim() || busy) return;
    setBusy(true); setExperiment(null);
    try {
      const r = await fetch("/api/runtime/assess", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request }) });
      const d = await r.json(); setAssessment(d.assessment);
    } finally { setBusy(false); }
  };
  const openExperiment = async () => {
    if (!request.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/runtime/experiment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request }) });
      const d = await r.json(); setExperiment(d); if (d.assessment) setAssessment(d.assessment);
    } finally { setBusy(false); }
  };
  return <div className="space-y-4">
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3"><div className="p-2 rounded-xl bg-indigo-50 text-indigo-700"><ShieldCheck className="w-5 h-5"/></div><div><h2 className="font-bold">Runtime Control Plane — V2</h2><p className="text-xs text-slate-500">La intención se evalúa antes de ejecutar. LLaMA no valida por complacencia.</p></div></div>
      <textarea value={request} onChange={e=>setRequest(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Describe qué quieres crear, cambiar, probar o validar…"/>
      <div className="flex gap-2 mt-3"><button onClick={assess} disabled={busy||!request.trim()} className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold flex items-center gap-2 disabled:opacity-40"><Search className="w-4 h-4"/> Evaluar intención</button><button onClick={openExperiment} disabled={busy||!request.trim()||assessment?.decision==='CLARIFICATION'} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"><Play className="w-4 h-4"/> Abrir experimento</button></div>
    </section>
    {assessment && <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"><div className="flex justify-between"><h3 className="font-bold text-sm">Evaluación</h3><span className="font-mono text-xs px-2 py-1 rounded bg-slate-100">{assessment.decision}</span></div><div className="text-xs space-y-2"><div><b>Conocido:</b> {(assessment.known||[]).join("; ")||"—"}</div><div><b>Falta:</b> {(assessment.missing||[]).join("; ")||"Nada detectado en esta pasada."}</div><div><b>Supuestos:</b> {(assessment.assumptions||[]).join("; ")||"—"}</div><div><b>Riesgos:</b> {(assessment.risks||[]).join("; ")||"No detectados por el evaluador semántico."}</div><div><b>Pruebas:</b> {(assessment.requiredTests||[]).join("; ")||"Definir antes de afirmar viabilidad."}</div></div></div>
      <div className="bg-slate-950 text-slate-100 rounded-2xl p-4 space-y-3"><h3 className="font-bold text-sm">Preguntas / contrato</h3>{(assessment.intent?.questions||[]).map((q:string,i:number)=><div key={i} className="text-xs border-b border-slate-800 pb-2">{i+1}. {q}</div>)}<div className="text-xs text-slate-400">Recomendación: {assessment.recommendation}</div></div>
    </section>}
    {experiment && <section className="bg-white border border-slate-200 rounded-2xl p-4"><div className="flex items-center gap-2 text-sm font-bold mb-2"><CheckCircle2 className="w-4 h-4"/> Experimento {experiment.status || experiment.status === "PASS" ? experiment.status : "CREATED"}</div><pre className="bg-slate-950 text-emerald-300 rounded-xl p-3 text-xs overflow-auto">{JSON.stringify(experiment,null,2)}</pre></section>}
    <section className="grid grid-cols-1 md:grid-cols-4 gap-3">{[[Lock,"Authority","TDCP/Gatekeeper"],[AlertTriangle,"Evidence","No success without proof"],[RotateCcw,"Reset","Disposable experiment"],[CheckCircle2,"Promotion","Explicit user approval"]].map(([Icon,title,text]:any)=><div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-3"><Icon className="w-4 h-4 mb-2"/><div className="font-semibold text-xs">{title}</div><div className="text-[11px] text-slate-500">{text}</div></div>)}</section>
  </div>;
};
