import React, { useEffect, useState } from "react";
import { Eye, Save, Sparkles, ShieldCheck } from "lucide-react";

export interface NexusVisionState {
  statement: string;
  currentGoal: string;
  constraints: string;
  desiredOutcome: string;
  lastUpdated: string;
}

export const DEFAULT_NEXUS_VISION: NexusVisionState = {
  statement: "",
  currentGoal: "",
  constraints: "",
  desiredOutcome: "",
  lastUpdated: ""
};

interface Props {
  vision: NexusVisionState;
  onChange: (vision: NexusVisionState) => void;
}

export const NexusVision: React.FC<Props> = ({ vision, onChange }) => {
  const [draft, setDraft] = useState(vision);
  const dirty = JSON.stringify(draft) !== JSON.stringify(vision);

  useEffect(() => setDraft(vision), [vision]);

  const update = (field: keyof NexusVisionState, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const save = () => {
    onChange({ ...draft, lastUpdated: new Date().toISOString() });
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700"><Eye className="w-5 h-5" /></div>
          <div>
            <h2 className="font-black text-lg">Contexto de trabajo</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              NEXUS registra aquí contexto, objetivos, restricciones y resultados observados durante la creación. Esto no constituye todavía la visión final de salida.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" /> Autoridad del usuario
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-xs font-bold text-slate-700">Contexto / propósito provisional</span>
          <textarea value={draft.statement} onChange={e => update("statement", e.target.value)} rows={5}
            className="mt-1.5 w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Qué estás construyendo, explorando o intentando resolver…" />
        </label>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Objetivo actual</span>
            <textarea value={draft.currentGoal} onChange={e => update("currentGoal", e.target.value)} rows={4}
              className="mt-1.5 w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Qué quieres conseguir ahora…" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Restricciones</span>
            <textarea value={draft.constraints} onChange={e => update("constraints", e.target.value)} rows={4}
              className="mt-1.5 w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Qué no debe cambiar, qué límites existen…" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Resultado deseado</span>
            <textarea value={draft.desiredOutcome} onChange={e => update("desiredOutcome", e.target.value)} rows={4}
              className="mt-1.5 w-full border border-slate-200 rounded-xl p-3 text-sm" placeholder="Cómo sabrás que la creación cumple su propósito…" />
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          El contexto puede acumular evidencia y decisiones. La declaración de visión para salida se realiza al final, cuando tú decides detener la creación.
        </p>
        <button onClick={save} disabled={!dirty}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40">
          <Save className="w-4 h-4" /> Guardar contexto
        </button>
      </div>
    </section>
  );
};
