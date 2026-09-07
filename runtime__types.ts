export type Risk = "low" | "medium" | "high" | "critical";
export type Decision = "DIRECT" | "CLARIFICATION" | "SAFE_REDIRECT" | "REVIEW" | "REJECT" | "PASS";

export interface IntentObject {
  intent: {
    goal: string;
    target: string;
    operation: string;
    scope: "sandbox" | "artifact" | "resource" | "project" | "unknown";
    reason: string;
    risk: Risk;
  };
  ambiguities: string[];
  assumptions: string[];
  missing: string[];
  questions: string[];
  proposedTests: string[];
  expectedEvidence: string[];
}

export interface OperationObject extends IntentObject {
  operationId: string;
  baselineHash?: string;
  resourceGrantsRequired: boolean;
  sideEffects: string[];
}

export interface Assessment {
  decision: Decision;
  confidence: "low" | "medium" | "high";
  known: string[];
  missing: string[];
  assumptions: string[];
  risks: string[];
  requiredTests: string[];
  recommendation: string;
  intent: IntentObject;
}
