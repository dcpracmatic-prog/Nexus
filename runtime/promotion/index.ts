import type { ExitEvaluation } from "../vision";

export type PromotionState = "CANDIDATE" | "PROMOTABLE" | "BLOCKED";

export function canPromote(state: PromotionState, explicitApproval: boolean, exitEvaluation: ExitEvaluation): boolean {
  return state === "PROMOTABLE" && explicitApproval === true && exitEvaluation.status === "READY";
}
