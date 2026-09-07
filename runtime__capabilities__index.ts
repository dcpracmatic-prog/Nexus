export type ExternalCapabilityType = "model" | "api" | "sdk" | "mcp" | "storage" | "cloud" | "database" | "compute" | "repository";

export type CapabilityOperation = "READ" | "PROCESS" | "MODIFY" | "PERSIST" | "EXPORT" | "SHARE" | "TRAIN" | "DERIVE" | "EXECUTE";

export interface ExternalCapability {
  id: string;
  name: string;
  type: ExternalCapabilityType;
  provider?: string;
  endpoint?: string;
  enabled: boolean;
  operations: CapabilityOperation[];
  allowedModules: string[];
  persistentCredential: boolean;
  createdAt: string;
  notes?: string;
}

export interface CapabilityRequest {
  capability: ExternalCapability;
  module: string;
  operation: CapabilityOperation;
  destination?: string;
  userApproved: boolean;
}

export interface CapabilityDecision {
  allowed: boolean;
  reasons: string[];
}

/** Connection is not authorization. A credential is not global authority. */
export function evaluateCapability(request: CapabilityRequest): CapabilityDecision {
  const reasons: string[] = [];
  if (!request.userApproved) reasons.push("La operación externa no fue autorizada por el usuario.");
  if (!request.capability.enabled) reasons.push("La capacidad externa está deshabilitada.");
  if (!request.capability.allowedModules.includes(request.module)) reasons.push("La capacidad no está autorizada para esta pestaña.");
  if (!request.capability.operations.includes(request.operation)) reasons.push(`La operación ${request.operation} no está dentro del alcance autorizado.`);
  if ((request.capability.type === "api" || request.capability.type === "mcp") && !request.destination && request.operation !== "READ") {
    reasons.push("La operación externa requiere un destino explícito.");
  }
  return { allowed: reasons.length === 0, reasons };
}

export const DEFAULT_CAPABILITIES: ExternalCapability[] = [
  {
    id: "cap-llama-local",
    name: "LLaMA local",
    type: "model",
    provider: "Ollama",
    endpoint: "http://127.0.0.1:11434/api/chat",
    enabled: true,
    operations: ["PROCESS", "DERIVE"],
    allowedModules: ["create", "analyze", "experiment", "render"],
    persistentCredential: false,
    createdAt: new Date(0).toISOString(),
    notes: "Modelo local de referencia de NEXUS. No recibe autoridad de publicación."
  }
];
