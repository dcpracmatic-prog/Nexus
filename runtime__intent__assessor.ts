import { Assessment, IntentObject, Risk } from "../types";

const pick = (text: string, re: RegExp) => re.test(text);

export function assessIntent(request: string): Assessment {
  const text = request.trim();
  const lower = text.toLowerCase();
  const missing: string[] = [];
  const ambiguities: string[] = [];
  const assumptions: string[] = [];
  const known: string[] = [];
  const risks: string[] = [];
  const tests: string[] = [];
  const questions: string[] = [];

  const operation = pick(lower, /valid|probar|test|benchmark|ejecut|analiz/) ? "validate" :
    pick(lower, /modific|cambiar|editar|refactor|agregar|crear/) ? "mutate" : "inspect";
  const target = pick(lower, /dataset|csv|json|document|pdf|archivo/) ? "evidence" :
    pick(lower, /proyecto|app|aplicaci|componente|código|codigo/) ? "project" : "unspecified";
  const scope = pick(lower, /sandbox|experimento|aislad/) ? "sandbox" : target === "evidence" ? "resource" : "unknown";
  const risk: Risk = pick(lower, /borrar|eliminar|producci|despleg|extern|webhook|api|credencial|secreto/) ? "high" :
    operation === "mutate" ? "medium" : "low";

  if (target !== "unspecified") known.push(`Objetivo aproximado identificado: ${target}.`); else missing.push("No se identifica con precisión el objetivo o recurso afectado.");
  if (operation !== "inspect") known.push(`Operación inferida: ${operation}.`);
  if (scope === "unknown") missing.push("El alcance de la operación no está definido; no debe asumirse host/proyecto/producción.");
  if (!/criterio|aceptaci|éxito|exito|metric|métrica|metrica|benchmark|test|prueba/i.test(text)) missing.push("No existe un criterio de aceptación verificable.");
  if (operation === "mutate" && !/qué|que|componente|archivo|módulo|modulo|target|afect/i.test(text)) missing.push("No está delimitado el conjunto de componentes que puede cambiar.");
  if (risk === "high") risks.push("La solicitud puede producir efectos persistentes o externos; requiere revisión y ejecución aislada antes de cualquier side effect.");
  if (operation === "mutate") assumptions.push("Se debe preservar todo componente no causalmente afectado por el cambio.");
  if (operation === "validate") tests.push("Ejecutar prueba reproducible contra baseline y registrar evidencia.");
  if (operation === "mutate") tests.push("Crear baseline, aplicar cambio en sandbox, ejecutar regresión y producir diff.");
  if (target === "evidence") tests.push("Verificar formato, estructura y procedencia antes de interpretar semántica.");

  if (missing.length > 0) {
    questions.push("¿Cuál es exactamente el resultado que quieres obtener?");
    if (scope === "unknown") questions.push("¿El cambio debe limitarse a un sandbox/experimento o puede afectar un artefacto persistente?");
    questions.push("¿Qué componentes o recursos están autorizados a cambiar o utilizarse?");
    questions.push("¿Qué prueba o métrica define que el resultado es aceptable?");
    questions.push("¿Qué consecuencias persistentes o externas aceptas, si alguna?");
  }

  const intent: IntentObject = {
    intent: { goal: text, target, operation, scope, reason: operation === "validate" ? "verification" : "user_request", risk },
    ambiguities, assumptions, missing, questions: questions.slice(0, 5), proposedTests: tests,
    expectedEvidence: ["trace reproducible", "decision determinista", "diff/artefacto cuando exista", "criterio de aceptación explícito"]
  };

  const decision = missing.length > 0 ? "CLARIFICATION" : risk === "high" ? "REVIEW" : "DIRECT";
  const confidence = missing.length >= 3 ? "low" : missing.length > 0 ? "medium" : "high";
  const recommendation = missing.length > 0
    ? "No afirmar viabilidad todavía. Resolver los faltantes antes de ejecutar."
    : risk === "high"
      ? "Revisión obligatoria; ejecutar primero en sandbox y pasar por el gate determinista."
      : "La intención está suficientemente definida para planificar; la viabilidad todavía requiere evidencia.";

  return { decision, confidence, known, missing, assumptions, risks, requiredTests: tests, recommendation, intent };
}
