import { evaluateCapability, type CapabilityRequest, type CapabilityDecision, type CapabilityOperation } from "../capabilities";
import { evaluateGrant, type ResourceGrant } from "../authorization/resourceAuthority";
import { arbitrate, type Capability as LogicCapability, type Observation } from "../logic";

export interface ActionGateRequest extends CapabilityRequest {
  resourceGrant?: ResourceGrant | null;
  requireGrant?: boolean;
}

export interface ActionGateDecision extends CapabilityDecision {
  gate: "ACTION_GATE";
  audit: {
    module: string;
    operation: string;
    destination?: string;
    capabilityId: string;
    timestamp: string;
  };
}

function logicCapability(operation: CapabilityOperation): LogicCapability {
  switch (operation) {
    case "PROCESS":
    case "EXECUTE": return operation === "EXECUTE" ? "EXECUTION" : "PROCESS";
    case "READ": return "OTHER";
    case "MODIFY": return "OTHER";
    case "PERSIST": return "OTHER";
    case "EXPORT": return "RELEASE";
    case "SHARE": return "NETWORK";
    case "TRAIN": return "PROCESS";
    case "DERIVE": return "PROCESS";
    default: return "OTHER";
  }
}

/**
 * NEXUS enforcement path. The deterministic arbitration algorithm is part of
 * the runtime decision itself; it does not execute I/O and is not an external tool.
 */
export function evaluateActionGate(request: ActionGateRequest): ActionGateDecision {
  const base = evaluateCapability(request);
  const reasons = [...base.reasons];
  const observations: Observation[] = [];
  const capability = logicCapability(request.operation);
  const context = `capability:${request.capability.id}|module:${request.module}|operation:${request.operation}`;

  observations.push({
    id: `capability:${request.capability.id}`,
    severity: base.allowed ? "MEDIUM" : "HIGH",
    capability,
    authorized: base.allowed,
    context,
    claim: base.allowed ? "allow" : "deny",
    weight: base.allowed ? 1 : 10,
    source: "nexus.capability"
  });

  if (request.requireGrant) {
    const grant = evaluateGrant(request.resourceGrant ?? null, request.operation);
    if (!grant.allowed) reasons.push(`Recurso: ${grant.reason}`);
    observations.push({
      id: `grant:${request.resourceGrant?.resourceId ?? "none"}`,
      severity: grant.allowed ? "MEDIUM" : "HIGH",
      capability: "AUTHORITY",
      authorized: grant.allowed,
      context: `grant:${request.resourceGrant?.resourceId ?? "none"}|operation:${request.operation}`,
      claim: grant.allowed ? "allow" : "deny",
      weight: grant.allowed ? 1 : 10,
      source: "nexus.resourceAuthority"
    });
  }

  const logic = arbitrate(observations, {
    protectedCapabilities: new Set<LogicCapability>([
      "PROCESS", "NETWORK", "REPOSITORY", "AUTHORITY", "EXECUTION", "RELEASE", "SECRET"
    ])
  });

  if (logic.decision !== "PASS") {
    const marker = "La operación no cumple las restricciones deterministas del runtime.";
    if (!reasons.includes(marker)) reasons.push(marker);
  }

  return {
    gate: "ACTION_GATE",
    allowed: base.allowed && logic.decision === "PASS",
    reasons,
    audit: {
      module: request.module,
      operation: request.operation,
      destination: request.destination,
      capabilityId: request.capability.id,
      timestamp: new Date().toISOString()
    }
  };
}
