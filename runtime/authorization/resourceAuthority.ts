export interface ResourceGrant {
  resourceId: string;
  subjectId: string;
  operations: string[];
  expiresAt?: string;
  allowExport: boolean;
  allowPersist: boolean;
  allowTrain: boolean;
}

export function evaluateGrant(grant: ResourceGrant | null, operation: string) {
  if (!grant) return { allowed: false, reason: "NO_GRANT" };
  if (!grant.operations.includes(operation)) return { allowed: false, reason: "OPERATION_NOT_GRANTED" };
  if (grant.expiresAt && Date.parse(grant.expiresAt) <= Date.now()) return { allowed: false, reason: "GRANT_EXPIRED" };
  return { allowed: true, reason: "GRANT_VALID" };
}
