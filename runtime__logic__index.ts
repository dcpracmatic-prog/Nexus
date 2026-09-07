export type Decision = 'PASS' | 'REVIEW' | 'REJECT';
export type Claim = 'allow' | 'deny';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type Capability = 'PROCESS' | 'NETWORK' | 'REPOSITORY' | 'AUTHORITY' | 'EXECUTION' | 'RELEASE' | 'SECRET' | 'OTHER';

export type Observation = {
  id: string;
  severity: Severity;
  capability: Capability;
  authorized: boolean;
  context: string;
  claim: Claim;
  weight?: number;
  source?: string;
  evidence?: string;
};

export type Policy = {
  protectedCapabilities: Set<Capability>;
  hardRejectSeverities?: Set<Severity>;
};

export type ArbitrationResult = {
  decision: Decision;
  reason: 'empty' | 'consistent_allow' | 'consistent_deny' | 'soft_conflict' | 'protected_unauthorized';
  rejectIds: string[];
  reviewIds: string[];
  selectedIds: string[];
  trace: {
    hardReject: boolean;
    conflictContexts: string[];
    selectedClaims: Record<string, Claim>;
  };
};

const DEFAULT_HARD_SEVERITIES = new Set<Severity>(['HIGH']);

function cleanContext(value: string): string {
  return value.trim().toLowerCase();
}

function weightOf(o: Observation): number {
  return Number.isFinite(o.weight) ? Math.max(0, o.weight as number) : 1;
}

/**
 * Deterministic arbitration layer. It never executes an action.
 * Hard policy boundaries are evaluated before soft conflict arbitration.
 */
export function arbitrate(observations: Observation[], policy: Policy): ArbitrationResult {
  const hardSeverities = policy.hardRejectSeverities ?? DEFAULT_HARD_SEVERITIES;

  if (observations.length === 0) {
    return {
      decision: 'PASS', reason: 'empty', rejectIds: [], reviewIds: [], selectedIds: [],
      trace: { hardReject: false, conflictContexts: [], selectedClaims: {} }
    };
  }

  const hard = observations.filter(o =>
    hardSeverities.has(o.severity) &&
    policy.protectedCapabilities.has(o.capability) &&
    !o.authorized
  );

  if (hard.length > 0) {
    return {
      decision: 'REJECT', reason: 'protected_unauthorized',
      rejectIds: hard.map(o => o.id), reviewIds: [], selectedIds: [],
      trace: { hardReject: true, conflictContexts: [], selectedClaims: {} }
    };
  }

  const ordered = [...observations].sort((a, b) =>
    weightOf(b) - weightOf(a) ||
    a.severity.localeCompare(b.severity) ||
    a.id.localeCompare(b.id)
  );

  const selected: Observation[] = [];
  const review: Observation[] = [];
  const selectedClaims: Record<string, Claim> = {};
  const conflictContexts = new Set<string>();

  for (const observation of ordered) {
    const context = cleanContext(observation.context);
    const existing = selected.find(s => cleanContext(s.context) === context);
    if (existing && existing.claim !== observation.claim) {
      review.push(observation);
      conflictContexts.add(context);
      continue;
    }
    selected.push(observation);
    selectedClaims[context] = observation.claim;
  }

  if (review.length > 0) {
    return {
      decision: 'REVIEW', reason: 'soft_conflict', rejectIds: [],
      reviewIds: review.map(o => o.id), selectedIds: selected.map(o => o.id),
      trace: { hardReject: false, conflictContexts: [...conflictContexts].sort(), selectedClaims }
    };
  }

  const hasDeny = selected.some(o => o.claim === 'deny');
  return {
    decision: hasDeny ? 'REJECT' : 'PASS',
    reason: hasDeny ? 'consistent_deny' : 'consistent_allow',
    rejectIds: hasDeny ? selected.filter(o => o.claim === 'deny').map(o => o.id) : [],
    reviewIds: [], selectedIds: selected.map(o => o.id),
    trace: { hardReject: false, conflictContexts: [], selectedClaims }
  };
}

export type NexusRequest = {
  operationId: string;
  target?: string;
  authorized?: boolean;
  resourceGrant?: boolean;
  context?: string;
  source?: string;
};

/** Normalize NEXUS action requests into LOGIC observations. No I/O is performed. */
export function observeNexusRequest(request: NexusRequest): Observation {
  const id = request.operationId || 'unknown-operation';
  const target = request.target ?? '';
  const source = request.source ?? 'nexus';
  const context = request.context ?? id;
  const authorized = request.authorized === true && request.resourceGrant !== false;
  const capability = capabilityForOperation(id);

  return {
    id,
    severity: authorized ? 'MEDIUM' : 'HIGH',
    capability,
    authorized,
    context,
    claim: authorized ? 'allow' : 'deny',
    weight: authorized ? 1 : 10,
    source,
    evidence: target ? `target:${target}` : undefined
  };
}

function capabilityForOperation(operationId: string): Capability {
  const op = operationId.toLowerCase();
  if (op.includes('terminal') || op.includes('exec') || op.includes('process')) return 'PROCESS';
  if (op.includes('clone') || op.includes('repo') || op.includes('git')) return 'REPOSITORY';
  if (op.includes('dispatch') || op.includes('network') || op.includes('fetch')) return 'NETWORK';
  if (op.includes('capabilit') || op.includes('author')) return 'AUTHORITY';
  if (op.includes('sandbox')) return 'EXECUTION';
  if (op.includes('release')) return 'RELEASE';
  if (op.includes('secret')) return 'SECRET';
  return 'OTHER';
}

export const DEFAULT_NEXUS_POLICY: Policy = {
  protectedCapabilities: new Set<Capability>([
    'PROCESS', 'NETWORK', 'REPOSITORY', 'AUTHORITY', 'EXECUTION', 'RELEASE', 'SECRET'
  ]),
  hardRejectSeverities: new Set<Severity>(['HIGH'])
};
