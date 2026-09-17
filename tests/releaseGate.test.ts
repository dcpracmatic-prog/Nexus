import { requestRelease } from "../runtime/promotion/releaseGate";
import { evaluateCapability } from "../runtime/capabilities";
import { createExplicitTransfer } from "../runtime/isolation";

const base = {
  userId: "local-test",
  declaredVision: "MVP procesa texto localmente y no contacta sistemas externos.",
  evidenceAvailable: true,
  testsPassed: true,
  testEvidence: ["unit-test"],
  observedExcess: [],
  declaredSideEffects: [],
  scope: "artifact" as const,
  promotionState: "PROMOTABLE" as const,
  payload: "export function main(){ return 1; }",
  kind: "code" as const,
  artifactName: "mvp.js"
};

const blocked = requestRelease({ ...base, hasExplicitUserApproval: false });
if (blocked.authorized || blocked.exitEvaluation.status !== "BLOCKED") throw new Error("Release without approval must be blocked");

const ready = requestRelease({ ...base, hasExplicitUserApproval: true });
if (!ready.authorized || ready.exitEvaluation.status !== "READY" || !ready.artifact || !ready.report) throw new Error("Approved valid release must be READY");

const capability = evaluateCapability({
  capability: {
    id: "cap-test", name: "API test", type: "api", enabled: true, operations: ["READ"], allowedModules: ["create"], persistentCredential: false, createdAt: new Date().toISOString()
  },
  module: "analyze", operation: "READ", userApproved: true
});
if (capability.allowed) throw new Error("Capability must be denied outside its allowed module");

const transfer = createExplicitTransfer("create", "analyze", "mvp.js", "content");
if (transfer.initiatedBy !== "USER" || transfer.from === transfer.to) throw new Error("Transfer must be explicit and cross-tab");

console.log(JSON.stringify({ blocked: blocked.exitEvaluation.status, ready: ready.exitEvaluation.status, report: !!ready.report, capabilityDenied: !capability.allowed, transfer: transfer.initiatedBy }));


import { createSandboxSession, executeSandboxOperation, destroySandboxSession, evaluateActionGate, DEFAULT_CAPABILITIES } from "../runtime/index";

const sb = createSandboxSession("test-tab");
const sbResult = await executeSandboxOperation(sb.id, "TEXT_ANALYZE", "hola nexus");
if (!sbResult.ok || !(sbResult.result as any)?.sha256) throw new Error("Sandbox TEXT_ANALYZE failed");
const denied = evaluateActionGate({ capability: DEFAULT_CAPABILITIES[0], module: "resources", operation: "PROCESS", userApproved: true });
if (denied.allowed) throw new Error("Action Gate allowed unauthorized module");
destroySandboxSession(sb.id);
console.log(JSON.stringify({ sandbox: sbResult.ok, actionGateDenied: !denied.allowed }));

import { arbitrate, evaluateActionGate, DEFAULT_CAPABILITIES } from "../runtime/index";

const gateAllowed = evaluateActionGate({
  capability: DEFAULT_CAPABILITIES[0],
  module: "create",
  operation: "PROCESS",
  userApproved: true
});
if (!gateAllowed.allowed) throw new Error("Integrated deterministic gate must allow an authorized capability");

const gateDenied = evaluateActionGate({
  capability: DEFAULT_CAPABILITIES[0],
  module: "resources",
  operation: "PROCESS",
  userApproved: true
});
if (gateDenied.allowed) throw new Error("Integrated deterministic gate must reject an out-of-scope capability");

const gateGrantDenied = evaluateActionGate({
  capability: DEFAULT_CAPABILITIES[0],
  module: "create",
  operation: "PROCESS",
  userApproved: true,
  requireGrant: true,
  resourceGrant: null
});
if (gateGrantDenied.allowed) throw new Error("Integrated deterministic gate must reject a missing protected resource grant");

const conflict = arbitrate([
  { id: "allow", severity: "MEDIUM", capability: "PROCESS", authorized: true, context: "process:build", claim: "allow", weight: 1 },
  { id: "deny", severity: "MEDIUM", capability: "PROCESS", authorized: true, context: "process:build", claim: "deny", weight: 2 }
], { protectedCapabilities: new Set(["PROCESS"]) });
if (conflict.decision !== "REVIEW" || conflict.reason !== "soft_conflict") throw new Error("Integrated deterministic arbitration must detect same-context conflicts");

console.log(JSON.stringify({ integratedGateAllow: gateAllowed.allowed, integratedGateDeny: !gateDenied.allowed, integratedGrantDeny: !gateGrantDenied.allowed, conflictReview: conflict.decision === "REVIEW" }));
