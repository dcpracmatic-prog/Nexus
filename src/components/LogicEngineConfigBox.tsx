import React, { useState, useEffect } from "react";
import {
  Cpu,
  ShieldCheck,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Binary,
  Layers,
  Sparkles,
  Info,
  Scale,
  ShieldAlert,
  Save,
  Check
} from "lucide-react";
import {
  LogicEngineConfig,
  LogicExecutionResult,
  LogicExecutionInput,
  DEFAULT_LOGIC_CONFIG,
  solveLogic
} from "../lib/logicEngine";

interface LogicEngineConfigBoxProps {
  initialConfig?: LogicEngineConfig;
  onSaveConfig?: (config: LogicEngineConfig) => Promise<void> | void;
}

export function LogicEngineConfigBox({
  initialConfig,
  onSaveConfig
}: LogicEngineConfigBoxProps) {
  const [config, setConfig] = useState<LogicEngineConfig>(
    initialConfig || DEFAULT_LOGIC_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"tuning" | "sandbox">("tuning");

  // Interactive Sandbox state
  const [sandboxCase, setSandboxCase] = useState<"authority_reject" | "pure_relational" | "geometric_1d" | "custom">("authority_reject");
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<LogicExecutionResult | null>(null);

  // Custom graph input
  const [customNodesCount, setCustomNodesCount] = useState<number>(5);
  const [customEdgesText, setCustomEdgesText] = useState<string>("0-1, 1-2, 2-3, 3-4");
  const [customReferenceId, setCustomReferenceId] = useState<number>(4);

  // Sync if initialConfig updates
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Run a default test case on mount to populate the sandbox
  useEffect(() => {
    runSandboxTest(sandboxCase, config);
  }, []);

  const handlePresetSelect = (presetName: string) => {
    let updated: LogicEngineConfig;
    if (presetName === "Arbitraje de Seguridad & Invariantes Causales") {
      updated = {
        ...DEFAULT_LOGIC_CONFIG,
        presetName
      };
    } else if (presetName === "Alta Velocidad / Throughput (SA Bitmask Heurístico)") {
      updated = {
        ...config,
        presetName,
        defaultRoute: "sa_bitmask_heuristic",
        saIterations: 1000,
        saCoolingRate: 0.992,
        saInitialTemp: 1.0,
        bbNodeBudget: 25
      };
    } else if (presetName === "Ultra-Exacto Branch & Bound (Tolerancia Cero)") {
      updated = {
        ...config,
        presetName,
        defaultRoute: "bb_bitmask_exact",
        bbNodeBudget: 50,
        timeBudgetSeconds: 5.0,
        strictInvariants: true
      };
    } else if (presetName === "Enrutador Geométrico 1D (Prefix Sum)") {
      updated = {
        ...config,
        presetName,
        defaultRoute: "geometric_1d_exact",
        conflictDistanceThreshold: 0.25
      };
    } else {
      updated = { ...DEFAULT_LOGIC_CONFIG };
    }

    setConfig(updated);
    runSandboxTest(sandboxCase, updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Also persist to server endpoint if available
      try {
        await fetch("/api/engine/logic/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });
      } catch (err) {
        console.warn("Could not sync config to server API:", err);
      }

      if (onSaveConfig) {
        await onSaveConfig(config);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_LOGIC_CONFIG });
    runSandboxTest(sandboxCase, DEFAULT_LOGIC_CONFIG);
  };

  // Run sandbox execution
  const runSandboxTest = (selectedCase: string, activeCfg: LogicEngineConfig = config) => {
    setIsRunning(true);
    try {
      let input: LogicExecutionInput;

      if (selectedCase === "authority_reject") {
        // 4 nodes: 0, 1, 2 and 3(Reference).
        // 0-3 (conflict with reference => REJECT), 1-2 (conflict between peers => REVIEW/PASS).
        const matrix = [
          [false, false, false, true], // 0 connected to 3 (Reference)
          [false, false, true, false], // 1 connected to 2
          [false, true, false, false], // 2 connected to 1
          [true, false, false, false]  // 3 (Reference)
        ];
        input = {
          matrix,
          weights: [1.0, 2.0, 1.0, activeCfg.referenceDominanceWeight],
          referenceIds: [3],
          nodeLabels: [
            "Flujo X (Conflicto directo con Referencia)",
            "Flujo Y (Candidato Par con peso 2.0)",
            "Flujo Z (Candidato Par con peso 1.0)",
            "Autoridad de Referencia Protegida [R]"
          ]
        };
      } else if (selectedCase === "pure_relational") {
        // No reference authority: 3 nodes in triangle/line conflict.
        // Pure relational exclusions must NEVER produce REJECT; only PASS or REVIEW.
        const matrix = [
          [false, true, false],
          [true, false, true],
          [false, true, false]
        ];
        input = {
          matrix,
          weights: [1.5, 2.5, 1.5],
          referenceIds: [], // NO REFERENCE
          nodeLabels: [
            "Solicitud Alpha (Peso 1.5)",
            "Solicitud Beta (Peso 2.5)",
            "Solicitud Gamma (Peso 1.5)"
          ]
        };
      } else if (selectedCase === "geometric_1d") {
        // 1D points on real line with window threshold 0.25
        const points = [0.00, 0.02, -0.01, 1.00, 1.02, 0.98, 0.00];
        const weights = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, activeCfg.referenceDominanceWeight];
        input = {
          points,
          threshold: activeCfg.conflictDistanceThreshold,
          weights,
          referenceIds: [6],
          nodeLabels: [
            "Cluster A0 (0.00)",
            "Cluster A1 (0.02)",
            "Cluster A2 (-0.01)",
            "Cluster B0 (1.00)",
            "Cluster B1 (1.02)",
            "Cluster B2 (0.98)",
            "Autoridad Central (0.00)"
          ]
        };
      } else {
        // Custom
        const n = Math.max(2, Math.min(20, customNodesCount));
        const matrix: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
        const pairs = customEdgesText.split(",").map((p) => p.trim());
        for (const pair of pairs) {
          const parts = pair.split("-").map((x) => parseInt(x.trim(), 10));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const u = parts[0];
            const v = parts[1];
            if (u >= 0 && u < n && v >= 0 && v < n && u !== v) {
              matrix[u][v] = true;
              matrix[v][u] = true;
            }
          }
        }
        const weights = new Array(n).fill(1.0);
        const refId = customReferenceId >= 0 && customReferenceId < n ? customReferenceId : -1;
        if (refId >= 0) {
          weights[refId] = activeCfg.referenceDominanceWeight;
        }

        input = {
          matrix,
          weights,
          referenceIds: refId >= 0 ? [refId] : [],
          nodeLabels: Array.from({ length: n }, (_, i) => `Nodo #${i}${i === refId ? " [REF]" : ""}`)
        };
      }

      const res = solveLogic(input, activeCfg);
      setExecutionResult(res);
    } catch (err: any) {
      console.error("Error running LOGIC sandbox:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Header Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Caja de Configuración del Motor LOGIC (MML)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>MML de Sistema Activo</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Motor combinatorio de invariantes causales y conjuntos independientes de peso máximo (MWIS).
                Configuración del núcleo de enrutamiento exacto/heurístico, bitmasks y arbitraje relacional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Valores</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-md ${
                saveSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Configuración Guardada</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Guardando..." : "Guardar Motor"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Selector Chips */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets del Motor:
          </span>
          {[
            "Arbitraje de Seguridad & Invariantes Causales",
            "Alta Velocidad / Throughput (SA Bitmask Heurístico)",
            "Ultra-Exacto Branch & Bound (Tolerancia Cero)",
            "Enrutador Geométrico 1D (Prefix Sum)"
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                config.presetName === preset
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: Parámetros del Motor vs Consola de Verificación */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("tuning")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "tuning"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Calibración de Parámetros del Núcleo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("sandbox");
            runSandboxTest(sandboxCase, config);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "sandbox"
              ? "bg-indigo-600 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Simulador y Auditor de Invariantes</span>
        </button>
      </div>

      {/* TAB 1: TUNING PARAMETERS */}
      {activeTab === "tuning" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Controls (Left 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Binary className="w-4 h-4 text-indigo-600" />
                <span>Enrutamiento y Algoritmos del Motor LOGIC</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controla cómo el motor resuelve el Conjunto Independiente de Peso Máximo (MWIS) según la dimensionalidad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Default Router Method */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Modo de Enrutamiento del Solver
                </label>
                <select
                  value={config.defaultRoute}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setConfig({ ...config, defaultRoute: val });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="auto">Auto (B&B Exacto si N ≤ Presupuesto, sino SA Heurístico)</option>
                  <option value="bb_bitmask_exact">Branch & Bound con Bitmask (100% Exacto)</option>
                  <option value="sa_bitmask_heuristic">Simulated Annealing Bitmask (Heurístico)</option>
                  <option value="geometric_1d_exact">Prefix Sum Geométrico 1D O(N log N)</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  En modo "Auto", garantiza tiempo sub-segundo con óptimo provable para N pequeño y aproximación rápida para grafos densos.
                </p>
              </div>

              {/* Branch & Bound Node Budget */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Límite Nodos B&B Exacto
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    N ≤ {config.bbNodeBudget}
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  step={1}
                  value={config.bbNodeBudget}
                  onChange={(e) => setConfig({ ...config, bbNodeBudget: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Límite máximo de nodos para buscar el óptimo exacto mediante ramificación y poda de 64 bits.
                </p>
              </div>

              {/* Time Budget for B&B */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Presupuesto de Tiempo B&B
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {config.timeBudgetSeconds.toFixed(1)} s
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  value={config.timeBudgetSeconds}
                  onChange={(e) => setConfig({ ...config, timeBudgetSeconds: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Si B&B excede este tiempo, conmuta sin fallar a Simulated Annealing preservando la independencia del conjunto.
                </p>
              </div>

              {/* SA Iterations */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Iteraciones Simulated Annealing
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {config.saIterations} iteraciones
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2500}
                  step={50}
                  value={config.saIterations}
                  onChange={(e) => setConfig({ ...config, saIterations: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Número de permutaciones 1-to-2 y 1-to-1 con enfriamiento térmico para aproximar el MWIS.
                </p>
              </div>

              {/* Reference Dominance Weight */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Peso de Dominancia de Autoridad de Referencia
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.referenceDominanceWeight}
                    onChange={(e) => setConfig({ ...config, referenceDominanceWeight: parseFloat(e.target.value) || 1e12 })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                  />
                  <span className="text-xs font-mono text-slate-400">1e12</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Asigna un peso hegemónico al nodo de referencia para garantizar su pertenencia invariante en el MWIS.
                </p>
              </div>

              {/* Deterministic Seed */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Semilla Determinista (Seed)
                </label>
                <input
                  type="number"
                  value={config.seed}
                  onChange={(e) => setConfig({ ...config, seed: parseInt(e.target.value, 10) || 42 })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Garantiza determinismo estricto e idéntico resultado en cualquier entorno o nodo distribuido.
                </p>
              </div>
            </div>

            {/* Invariant Rules Toggle */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Regla Causal: REJECT Requiere Autoridad de Referencia</span>
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Bajo las invariantes LOGIC, un nodo sólo entra en <strong>REJECT</strong> si colisiona directamente con el nodo de referencia protegido.
                  Las exclusiones causadas por conflictos entre pares sin contradicción de autoridad entran en <strong>REVIEW</strong>.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.strictInvariants}
                onChange={(e) => setConfig({ ...config, strictInvariants: e.target.checked })}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Theoretical Rules & Invariant Badges (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white space-y-4 shadow-md">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>Invariantes del Motor LOGIC</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="font-bold text-emerald-400">1. Independencia Mutua (MWIS)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ningún par de nodos en el conjunto seleccionado comparte arista de conflicto.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="font-bold text-cyan-400">2. Autoridad Protegida</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    El nodo de referencia seleccionado fija la norma y expulsa cualquier contradicción directa.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="font-bold text-amber-400">3. Exclusión sin Autoridad = REVIEW</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Si no hay nodo de referencia o el conflicto es puramente entre pares, la exclusión no es REJECT.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="font-bold text-indigo-400">4. Bitmask Branch & Bound</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Aceleración por máscaras de bits con poda por cotas superiores de suma de sufijos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 text-slate-700 text-xs space-y-2">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Aplicación en Flotas de Agentes</span>
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Cuando configuras un agente con el modelo <strong>LOGIC MML Core</strong> o la herramienta <strong>logic_mwis</strong>,
                sus decisiones de exclusión y arbitraje se computan con esta caja de parámetros en memoria local sin depender de APIs externas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE SANDBOX & VERIFIER */}
      {activeTab === "sandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Test Case Chooser (Left 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-indigo-600" />
                <span>Casos de Verificación de la Caja</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Seed: {config.seed}</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setSandboxCase("authority_reject");
                  runSandboxTest("authority_reject", config);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  sandboxCase === "authority_reject"
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Caso 1: Conflicto con Autoridad</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">4 Nodos</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  1 nodo de referencia protegida [R]. Un nodo choca con [R] (REJECT) y dos pares chocan entre sí (PASS y REVIEW).
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSandboxCase("pure_relational");
                  runSandboxTest("pure_relational", config);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  sandboxCase === "pure_relational"
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Caso 2: Red Relacional sin Referencia</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">0 REJECT</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sin autoridad de referencia. Comprueba la invariante: los descartes son <strong>REVIEW</strong>, jamás REJECT.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSandboxCase("geometric_1d");
                  runSandboxTest("geometric_1d", config);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  sandboxCase === "geometric_1d"
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Caso 3: Ruta Geométrica 1D</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Prefix Sum</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  7 puntos en recta real con umbral de ventana 0.25 y solver O(N log N) por sumas prefijas.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSandboxCase("custom");
                  runSandboxTest("custom", config);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  sandboxCase === "custom"
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Caso 4: Grafo Personalizado</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">Manual</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Define número de vértices, aristas de conflicto y el índice de autoridad de referencia.
                </p>
              </button>
            </div>

            {sandboxCase === "custom" && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nodos (2-20)</label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={customNodesCount}
                      onChange={(e) => setCustomNodesCount(parseInt(e.target.value, 10) || 5)}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nodo Referencia</label>
                    <input
                      type="number"
                      min={-1}
                      max={customNodesCount - 1}
                      value={customReferenceId}
                      onChange={(e) => setCustomReferenceId(parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aristas de Conflicto (u-v, u-v)</label>
                  <input
                    type="text"
                    value={customEdgesText}
                    onChange={(e) => setCustomEdgesText(e.target.value)}
                    placeholder="0-1, 1-2, 2-3"
                    className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-mono text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => runSandboxTest(sandboxCase, config)}
              disabled={isRunning}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Play className={`w-4 h-4 fill-current ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Calculando MWIS..." : "Ejecutar Motor con Configuración Actual"}</span>
            </button>
          </div>

          {/* Sandbox Execution Terminal / Result (Right 7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 shadow-md p-5 text-white flex flex-col justify-between">
            <div className="space-y-4">
              {/* Telemetry Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Telemetría del Motor LOGIC
                  </span>
                </div>

                {executionResult && (
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      {executionResult.executionTimeMs} ms
                    </span>
                    <span className="text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                      {executionResult.methodUsed}
                    </span>
                  </div>
                )}
              </div>

              {executionResult ? (
                <div className="space-y-4 font-mono text-xs">
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">PASS (MWIS)</span>
                      <span className="text-base font-bold text-emerald-400">
                        {executionResult.counts.pass}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">REVIEW</span>
                      <span className="text-base font-bold text-amber-400">
                        {executionResult.counts.review}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">REJECT</span>
                      <span className="text-base font-bold text-rose-400">
                        {executionResult.counts.reject}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">REFERENCIA</span>
                      <span className="text-base font-bold text-cyan-400">
                        {executionResult.counts.reference}
                      </span>
                    </div>
                  </div>

                  {/* Invariant Validations */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Auditoría Formal de Invariantes Causales:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-300">Independencia Mutua:</span>
                        <span className={executionResult.invariants.isIndependent ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {executionResult.invariants.isIndependent ? "PASS" : "FAIL"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-300">Autoridad Protegida:</span>
                        <span className={executionResult.invariants.referenceAuthoritySelected ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {executionResult.invariants.referenceAuthoritySelected ? "PRESERVADA" : "EXCLUIDA"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-300">REJECT Requiere Ref:</span>
                        <span className={executionResult.invariants.rejectRequiresReference ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {executionResult.invariants.rejectRequiresReference ? "PASS" : "VIOLACIÓN"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <span className="text-slate-300">Sin Ref → 0 REJECT:</span>
                        <span className={executionResult.invariants.noReferenceNoReject ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                          {executionResult.invariants.noReferenceNoReject ? "PASS" : "VIOLACIÓN"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nodes breakdown list */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Partición de Nodos Resuelta:
                    </span>
                    {executionResult.nodeDetails.map((node) => {
                      const stateColor =
                        node.state === "PASS"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : node.state === "REVIEW"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : node.state === "REJECT"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";

                      return (
                        <div
                          key={node.id}
                          className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold">#{node.id}</span>
                            <span className="text-slate-200">{node.label}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">
                              W={node.weight >= 1e9 ? "∞" : node.weight.toFixed(1)} | Grado={node.degree}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateColor}`}>
                              {node.state}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 space-y-2 font-sans">
                  <Binary className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs">Presiona "Ejecutar Motor con Configuración Actual" para auditar invariantes.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Optimización: Bitmask 64-bit SIMD Array</span>
              <span className="text-emerald-400 font-bold">Invariante Causal Activa</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
