import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Upload, Terminal, MessageSquare, ShieldCheck, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { RealTerminal } from "./RealTerminal";

type LogLine = { kind: "cmd" | "out" | "err" | "info"; text: string; ts: string };

type Result = { status: string; summary: string; metrics?: Record<string, any>; report?: any; commands?: string[] };

export const ValidationLab: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [llamaStatus, setLlamaStatus] = useState("READY");
  const [assessment, setAssessment] = useState<any>(null);
  const [chat, setChat] = useState<{role:string;text:string}[]>([
    { role: "assistant", text: "Laboratorio listo. Sube un dataset o documento y describe en texto plano qué quieres validar. Yo convierto la solicitud en una prueba reproducible; la terminal mostrará cada comando y salida." }
  ]);
  const abortRef = useRef<AbortController | null>(null);

  const addLog = (kind: LogLine["kind"], text: string) => setLogs(x => [...x, { kind, text, ts: new Date().toLocaleTimeString() }]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const runValidation = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true); setResult(null); setLlamaStatus("RUNNING");
    setChat(x => [...x, { role: "user", text: prompt }]);
    setPrompt("");
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const assessmentRes = await fetch("/api/runtime/assess", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: prompt }), signal: controller.signal
      });
      const assessmentData = await assessmentRes.json();
      setAssessment(assessmentData.assessment || null);
      if (assessmentData.assessment?.decision === "CLARIFICATION") {
        const a = assessmentData.assessment;
        const msg = `${a.recommendation}\n\nFalta: ${(a.missing || []).join("; ")}\n\nPreguntas: ${(a.intent?.questions || []).join(" | ")}`;
        setChat(x => [...x, { role: "assistant", text: msg }]);
        addLog("info", `LLaMA/Intent: CLARIFICATION — ${(a.missing || []).length} faltantes.`);
        setLlamaStatus("REVIEW");
        return;
      }
      const fd = new FormData();
      fd.append("request", chatRequest(prompt));
      files.forEach(f => fd.append("files", f));
      addLog("info", "Preparando validación controlada…");
      const res = await fetch("/api/validation/run", { method: "POST", body: fd, signal: controller.signal });
      const data = await res.json();
      (data.commands || []).forEach((c:string) => addLog("cmd", "$ " + c));
      (data.trace || []).forEach((t:any) => addLog(t.kind || "out", t.text || String(t)));
      setResult(data);
      setChat(x => [...x, { role: "assistant", text: data.summary || "Validación terminada." }]);
      setLlamaStatus("READY");
    } catch (e:any) {
      if (e.name === "AbortError") { addLog("info", "Proceso detenido por el usuario."); setLlamaStatus("STOPPED"); }
      else { addLog("err", e.message || "Error de ejecución"); setChat(x => [...x, { role:"assistant", text:"La validación falló. Revisa la terminal para ver exactamente dónde." }]); setLlamaStatus("ERROR"); }
    } finally { setRunning(false); abortRef.current = null; }
  };

  const chatRequest = (text:string) => text;

  const stop = async () => {
    abortRef.current?.abort();
    try { await fetch("/api/validation/stop", { method:"POST" }); } catch {}
    setRunning(false); setLlamaStatus("STOPPED"); addLog("info", "Solicitud de parada enviada al runtime LLaMA/validación.");
  };

  return <div className="space-y-4">
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-indigo-50 text-indigo-700"><ShieldCheck className="w-5 h-5"/></div><div><h2 className="font-bold">Laboratorio de Validación</h2><p className="text-xs text-slate-500">Pruebas reproducibles con evidencia visible.</p></div></div>
          <span className={`text-[10px] font-mono px-2 py-1 rounded-full border ${llamaStatus === "RUNNING" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200"}`}>LLaMA: {llamaStatus}</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4"><label className="flex items-center gap-2 cursor-pointer text-sm font-semibold"><Upload className="w-4 h-4"/> Dataset / documentos <input type="file" multiple className="hidden" accept=".csv,.json,.jsonl,.txt,.md,.log,.pdf" onChange={e=>setFiles(Array.from(e.target.files || []))}/></label>{files.length>0 && <div className="mt-3 space-y-1">{files.map(f=><div key={f.name} className="text-xs flex items-center gap-2 text-slate-600"><FileText className="w-3.5 h-3.5"/>{f.name} <span className="text-slate-400">({Math.round(f.size/1024)} KB)</span></div>)}</div>}</div>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();runValidation()}}} rows={4} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Ejemplo: valida este dataset, busca conflictos por proto+service+state, ejecuta LOGIC y dime cuántos PASS, REVIEW y REJECT hay. No uses las etiquetas para decidir."/>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
            <div className="flex justify-between"><span className="font-semibold">Intent assessment</span><span className="font-mono">{assessment?.decision || "—"}</span></div>
            {assessment?.missing?.length > 0 && <div><b>Falta:</b> {assessment.missing.join("; ")}</div>}
            {assessment?.risks?.length > 0 && <div><b>Riesgo:</b> {assessment.risks.join("; ")}</div>}
            {assessment?.requiredTests?.length > 0 && <div><b>Prueba requerida:</b> {assessment.requiredTests.join("; ")}</div>}
            {assessment?.recommendation && <div><b>Recomendación:</b> {assessment.recommendation}</div>}
          </div>
          <div className="flex gap-2"><button onClick={runValidation} disabled={running||!prompt.trim()} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2"><Play className="w-4 h-4"/> Ejecutar validación</button><button onClick={stop} disabled={!running} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2"><Square className="w-4 h-4"/> Parar LLaMA</button></div>
        </div>
      </section>

      <section className="bg-slate-950 rounded-2xl border border-slate-800 text-slate-100 overflow-hidden min-h-[360px] flex flex-col">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2"><Terminal className="w-4 h-4 text-emerald-400"/><span className="font-mono text-xs font-bold">validation@runtime:~$</span></div>
        <div className="p-3 overflow-y-auto flex-1 font-mono text-[11px] space-y-2">{logs.length===0?<span className="text-slate-500">Esperando ejecución…</span>:logs.map((l,i)=><div key={i} className={l.kind==='err'?'text-rose-400':l.kind==='cmd'?'text-cyan-300':l.kind==='info'?'text-slate-400':'text-emerald-300'}><span className="text-slate-600">[{l.ts}] </span>{l.text}</div>)}</div>
      </section>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-200 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-600"/><h3 className="font-bold text-sm">Chat de validación</h3></div><div className="p-4 max-h-[360px] overflow-y-auto space-y-3">{chat.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role==='user'?'bg-indigo-50 ml-8':'bg-slate-50 mr-8'}`}><div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{m.role==='user'?'Usuario':'LLaMA / Laboratorio'}</div>{m.text}</div>)}</div></section>
      <section className="bg-white rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-sm mb-3">Resultado</h3>{!result?<p className="text-sm text-slate-500">Aquí aparecerán métricas, invariantes y evidencia de la ejecución.</p>:<div className="space-y-3"><div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="w-4 h-4 text-emerald-600"/>{result.status}</div><p className="text-sm text-slate-700">{result.summary}</p>{result.metrics&&<pre className="bg-slate-950 text-emerald-300 rounded-xl p-3 text-[11px] overflow-auto">{JSON.stringify(result.metrics,null,2)}</pre>}{result.report?.warnings?.length>0&&<div className="text-xs text-amber-700 flex gap-2"><AlertTriangle className="w-4 h-4"/> {result.report.warnings.join("; ")}</div>}</div>}</section>
    </div>
    <div className="pt-2"><RealTerminal initialCommand={'printf "validation-lab ready\n"'} /></div>
    <p className="text-xs text-slate-500">Diseño: LLaMA interpreta la solicitud; los comandos de validación y LOGIC son deterministas y quedan visibles. Las etiquetas, cuando existan, se reservan para evaluación post-hoc.</p>
  </div>
};
