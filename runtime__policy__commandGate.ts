import { Assessment, OperationObject } from "../types";
import { arbitrate, type Observation, type Capability } from "../logic";

export function gateOperation(op: OperationObject, assessment: Assessment) {
  const violations: string[] = [];
  if (!op.operationId) violations.push("operationId requerido");
  if (assessment.missing.length) violations.push("faltantes de intención sin resolver");
  if (op.sideEffects.length && op.intent.scope !== "sandbox") violations.push("side effects requieren scope sandbox o autorización explícita");
  if (op.resourceGrantsRequired && !op.intent.target) violations.push("recurso protegido sin target definido");

  const observation: Observation = {
    id: op.operationId || "invalid-operation",
    severity: violations.length ? "HIGH" : "MEDIUM",
    capability: op.resourceGrantsRequired ? "AUTHORITY" : (op.intent.scope === "sandbox" ? "EXECUTION" : "OTHER"),
    authorized: violations.length === 0,
    context: `${op.intent.scope}:${op.intent.operation || op.operationId}`,
    claim: violations.length === 0 ? "allow" : "deny",
    weight: violations.length ? 10 : 1,
    source: "nexus.commandGate",
    evidence: violations.join(";") || undefined
  };

  const logic = arbitrate([observation], {
    protectedCapabilities: new Set<Capability>(["PROCESS", "NETWORK", "REPOSITORY", "AUTHORITY", "EXECUTION", "RELEASE", "SECRET"]),
  });

  if (logic.decision !== "PASS") violations.push("La operación no cumple las restricciones deterministas del runtime.");
  const allowed = violations.length === 0 && logic.decision === "PASS";
  return { allowed, decision: allowed ? "PASS" : "REVIEW", violations };
}
