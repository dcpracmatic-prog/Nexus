import { CapabilityDecision, evaluateCapability, type CapabilityRequest } from "../capabilities";

export interface TabWorkspace {
  tabId: string;
  sessionId: string;
  state: "EPHEMERAL" | "PERSISTED";
  importedWorkId?: string;
  inputHash?: string;
  createdAt: string;
}

export interface ExplicitTransfer {
  transferId: string;
  from: string;
  to: string;
  initiatedBy: "USER";
  artifactName: string;
  contentHash: string;
  createdAt: string;
}

export interface TabActionResult<T> {
  allowed: boolean;
  decision: CapabilityDecision;
  workspace: TabWorkspace;
  result?: T;
}

export function createEphemeralWorkspace(tabId: string, input?: string): TabWorkspace {
  return {
    tabId,
    sessionId: `${tabId}-${crypto.randomUUID()}`,
    state: "EPHEMERAL",
    inputHash: input ? `${input.length}-${input.slice(0, 24)}` : undefined,
    createdAt: new Date().toISOString()
  };
}

export function authorizeTabAction<T>(
  workspace: TabWorkspace,
  request: CapabilityRequest,
  work: () => T
): TabActionResult<T> {
  const decision = evaluateCapability(request);
  if (!decision.allowed) return { allowed: false, decision, workspace };
  try {
    const result = work();
    return { allowed: true, decision, workspace, result };
  } finally {
    // The runtime deliberately does not persist the working object here.
    // Persistence must be an explicit user action outside this function.
  }
}

export function createExplicitTransfer(from: string, to: string, artifactName: string, content: string): ExplicitTransfer {
  if (!from || !to || from === to) throw new Error("La transferencia requiere dos pestañas distintas.");
  return {
    transferId: crypto.randomUUID(),
    from,
    to,
    initiatedBy: "USER",
    artifactName,
    contentHash: `${content.length}-${content.slice(0, 24)}`,
    createdAt: new Date().toISOString()
  };
}
