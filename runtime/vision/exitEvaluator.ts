import { NEXUS_CONSTITUTION, ConstitutionalFinding } from "../constitution";

export type ExitStatus = "REVIEW" | "READY" | "BLOCKED";

export interface ExitEvaluationInput {
  declaredVision?: string;
  evidenceAvailable?: boolean;
  testsPassed?: boolean;
  observedExcess?: string[];
  constitutionalFindings?: ConstitutionalFinding[];
}

export interface ExitEvaluation {
  status: ExitStatus;
  reasons: string[];
  constitutionVersion: string;
  observedExcess: string[];
  constitutionalFindings: ConstitutionalFinding[];
}

export function evaluateExit(input: ExitEvaluationInput): ExitEvaluation {
  const excess = input.observedExcess ?? [];
  const findings = input.constitutionalFindings ?? [];
  const violated = findings.filter(f => f.violated);
  const reasons: string[] = [];

  if (!input.declaredVision?.trim()) reasons.push("Falta la declaración final de visión del usuario.");
  if (!input.evidenceAvailable) reasons.push("No existe evidencia suficiente para afirmar cumplimiento.");
  if (input.testsPassed === false || input.testsPassed == null) reasons.push("La creación todavía requiere pruebas/verificación.");
  if (excess.length) reasons.push("Existe comportamiento observado más allá de la visión declarada.");
  if (violated.length) reasons.push("Se detectó una violación constitucional.");

  let status: ExitStatus = "REVIEW";
  if (violated.length) status = "BLOCKED";
  else if (input.declaredVision?.trim() && input.evidenceAvailable && input.testsPassed === true && excess.length === 0) status = "READY";

  return { status, reasons, constitutionVersion: NEXUS_CONSTITUTION.version, observedExcess: excess, constitutionalFindings: findings };
}
