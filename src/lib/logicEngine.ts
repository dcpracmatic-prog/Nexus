/**
 * LOGIC CORE — MML Combinatorio de Sistema
 * 
 * Implementación TypeScript pura del motor LOGIC:
 * - Grafo de conflictos y pesos
 * - Autoridad de referencia protegida (ref_ids / REFERENCE)
 * - Partición causal estricta:
 *     * PASS: Seleccionado en el MWIS
 *     * REVIEW: Excluido relacionalmente por pares (sin autoridad directa)
 *     * REJECT: Conflicto directo con nodo de autoridad de referencia
 * - Resolutores:
 *     * geometric_1d_exact: Prefix sum O(N log N)
 *     * bb_bitmask_exact: Branch & Bound con bitmasks (BigInt / 64-bit)
 *     * sa_bitmask_heuristic: Simulated Annealing con aceleración de bitmasks
 *     * greedy_mwis_tiered: Heurística ponderada por grados con capas protegidas
 */

export type LogicState = "PASS" | "REVIEW" | "REJECT" | "REFERENCE";

export type LogicRouterMethod =
  | "auto"
  | "bb_bitmask_exact"
  | "sa_bitmask_heuristic"
  | "geometric_1d_exact";

export interface LogicEngineConfig {
  bbNodeBudget: number; // default: 45
  timeBudgetSeconds: number; // default: 1.0s
  saIterations: number; // default: 500
  saInitialTemp: number; // default: 1.0
  saCoolingRate: number; // default: 0.995
  saMinTemp: number; // default: 0.01
  referenceDominanceWeight: number; // default: 1e12
  defaultRoute: LogicRouterMethod; // default: 'auto'
  conflictDistanceThreshold: number; // default: 0.25
  strictInvariants: boolean; // default: true
  seed: number; // default: 42
  presetName?: string;
}

export const DEFAULT_LOGIC_CONFIG: LogicEngineConfig = {
  bbNodeBudget: 45,
  timeBudgetSeconds: 1.0,
  saIterations: 500,
  saInitialTemp: 1.0,
  saCoolingRate: 0.995,
  saMinTemp: 0.01,
  referenceDominanceWeight: 1e12,
  defaultRoute: "auto",
  conflictDistanceThreshold: 0.25,
  strictInvariants: true,
  seed: 42,
  presetName: "Arbitraje de Seguridad & Invariantes Causales"
};

export interface LogicExecutionInput {
  points?: number[];
  threshold?: number;
  adj?: Set<number>[];
  matrix?: boolean[][];
  weights?: number[];
  protectedIds?: number[];
  tiers?: number[][];
  referenceIds?: number[];
  nodeLabels?: string[];
  configOverride?: Partial<LogicEngineConfig>;
}

export interface LogicExecutionResult {
  selected: number[];
  totalWeight: number;
  methodUsed: string;
  isExact: boolean;
  executionTimeMs: number;
  states: Record<number, LogicState>;
  counts: {
    pass: number;
    review: number;
    reject: number;
    reference: number;
  };
  invariants: {
    isIndependent: boolean;
    referenceAuthoritySelected: boolean;
    rejectRequiresReference: boolean;
    noReferenceNoReject: boolean;
  };
  nodeDetails: {
    id: number;
    label: string;
    weight: number;
    degree: number;
    state: LogicState;
    conflictsWithRef: boolean;
    inSelected: boolean;
  }[];
}

// Pseudo-random number generator for deterministic executions
class DeterministicRNG {
  private s: number;
  constructor(seed: number = 42) {
    this.s = Math.abs(seed) % 2147483647 || 1;
  }
  random(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.random() * arr.length);
    return arr[idx];
  }
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }
}

/**
 * Invariant Check: Is the selected set independent in adj?
 */
export function isIndependent(adj: Set<number>[], selected: Set<number> | number[]): boolean {
  const selSet = selected instanceof Set ? selected : new Set(selected);
  for (const i of selSet) {
    const neighbors = adj[i];
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (selSet.has(neighbor)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Calculates sum of weights of selected set
 */
export function totalWeight(selected: Set<number> | number[], weights: number[]): number {
  let sum = 0;
  for (const i of selected) {
    sum += weights[i] || 0;
  }
  return sum;
}

/**
 * Build graph from boolean symmetric matrix
 */
export function buildConflictGraphFromMatrix(matrix: boolean[][]): Set<number>[] {
  const n = matrix.length;
  const adj: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matrix[i][j]) {
        adj[i].add(j);
        adj[j].add(i);
      }
    }
  }
  return adj;
}

/**
 * Classify States (Core Invariant):
 * - ref_ids => REFERENCE
 * - direct conflict with ref_ids => REJECT
 * - in selected MWIS => PASS
 * - relational exclusion without ref conflict => REVIEW
 */
export function classifyStates(
  adj: Set<number>[],
  selected: Set<number> | number[],
  refIds: Set<number> | number[]
): Record<number, LogicState> {
  const selSet = selected instanceof Set ? selected : new Set(selected);
  const refSet = refIds instanceof Set ? refIds : new Set(refIds);
  const states: Record<number, LogicState> = {};

  for (let i = 0; i < adj.length; i++) {
    if (refSet.has(i)) {
      states[i] = "REFERENCE";
      continue;
    }

    let conflictsWithRef = false;
    const neighbors = adj[i] || new Set();
    for (const ref of refSet) {
      if (neighbors.has(ref)) {
        conflictsWithRef = true;
        break;
      }
    }

    if (conflictsWithRef) {
      states[i] = "REJECT";
    } else if (selSet.has(i)) {
      states[i] = "PASS";
    } else {
      states[i] = "REVIEW";
    }
  }

  return states;
}

/**
 * Geometric 1D exact prefix-sum sliding window solver O(N log N)
 */
export function solveGeometric1D(
  points: number[],
  weights: number[],
  threshold: number
): { selected: Set<number>; weight: number } {
  const n = points.length;
  if (n === 0) return { selected: new Set(), weight: 0 };

  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => points[a] - points[b]);

  const sortedPts = indices.map((i) => points[i]);
  const sortedWeights = indices.map((i) => weights[i]);

  const prefix = new Float64Array(n + 1);
  prefix[0] = 0;
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + sortedWeights[i];
  }

  let bestW = -Infinity;
  let bestSet = new Set<number>();
  let l = 0;

  for (let r = 0; r < n; r++) {
    while (sortedPts[r] - sortedPts[l] > threshold) {
      l++;
    }
    const cur = prefix[r + 1] - prefix[l];
    if (cur > bestW) {
      bestW = cur;
      bestSet = new Set(indices.slice(l, r + 1));
    }
  }

  return { selected: bestSet, weight: bestW };
}

/**
 * Exact Branch & Bound with Bitmasks (BigInt support up to 64 nodes)
 */
export function solveBbBitmask(
  adj: Set<number>[],
  weights: number[],
  tiers: Set<number>[] = [],
  timeBudget: number = 1.0
): { selected: Set<number>; weight: number; timedOut: boolean } {
  const n = adj.length;
  const fixed = new Set<number>();

  // Fix protected tiers first
  for (const tier of tiers) {
    const sortedTier = Array.from(tier).sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
    for (const i of sortedTier) {
      let conflictsWithFixed = false;
      for (const f of fixed) {
        if (adj[i].has(f)) {
          conflictsWithFixed = true;
          break;
        }
      }
      if (!conflictsWithFixed) {
        fixed.add(i);
      }
    }
  }

  const allProtected = new Set<number>();
  for (const tier of tiers) {
    for (const item of tier) allProtected.add(item);
  }

  const remaining: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!fixed.has(i) && !allProtected.has(i)) {
      remaining.push(i);
    }
  }

  // Pre-calculate BigInt adj masks
  const adjMask: bigint[] = new Array(n).fill(0n);
  for (let i = 0; i < n; i++) {
    let m = 0n;
    for (const j of adj[i]) {
      m |= 1n << BigInt(j);
    }
    adjMask[i] = m;
  }

  let availMask = (1n << BigInt(n)) - 1n;
  for (const i of fixed) {
    availMask &= ~adjMask[i];
  }
  for (const i of allProtected) {
    if (!fixed.has(i)) {
      availMask &= ~(1n << BigInt(i));
    }
  }

  // Order remaining by weight desc
  const order = [...remaining].sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
  const suffix = new Float64Array(order.length + 1);
  for (let idx = order.length - 1; idx >= 0; idx--) {
    suffix[idx] = suffix[idx + 1] + (weights[order[idx]] || 0);
  }

  let baseW = totalWeight(fixed, weights);
  let bestW = baseW;
  let bestSet = new Set(fixed);
  let timedOut = false;

  const tStart = performance.now();
  let counter = 0;
  const CHECK_EVERY = 2000;
  const budgetMs = timeBudget * 1000;

  function rec(idx: number, avail: bigint, curW: number, curSet: Set<number>) {
    counter++;
    if (counter % CHECK_EVERY === 0 && performance.now() - tStart > budgetMs) {
      timedOut = true;
      return;
    }
    if (curW + suffix[idx] <= bestW) {
      return;
    }
    if (idx === order.length) {
      if (curW > bestW) {
        bestW = curW;
        bestSet = new Set(curSet);
      }
      return;
    }

    const v = order[idx];
    const bitV = 1n << BigInt(v);

    if ((avail & bitV) !== 0n) {
      curSet.add(v);
      rec(idx + 1, avail & ~adjMask[v] & ~bitV, curW + (weights[v] || 0), curSet);
      curSet.delete(v);
      if (timedOut) return;
    }

    rec(idx + 1, avail, curW, curSet);
  }

  rec(0, availMask, baseW, new Set(fixed));

  return { selected: bestSet, weight: bestW, timedOut };
}

/**
 * Tiered Greedy Initializer for MWIS
 */
export function greedyMwisTiered(
  adj: Set<number>[],
  weights: number[],
  tiers: Set<number>[] = []
): Set<number> {
  const n = adj.length;
  const selected = new Set<number>();
  const allProtected = new Set<number>();

  for (const tier of tiers) {
    for (const item of tier) allProtected.add(item);
    const sorted = Array.from(tier).sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
    for (const i of sorted) {
      let conflict = false;
      for (const s of selected) {
        if (adj[i].has(s)) {
          conflict = true;
          break;
        }
      }
      if (!conflict) {
        selected.add(i);
      }
    }
  }

  const remaining: number[] = [];
  for (let i = 0; i < n; i++) {
    if (!selected.has(i) && !allProtected.has(i)) {
      remaining.push(i);
    }
  }

  remaining.sort((a, b) => {
    const scoreA = (weights[a] || 0) / (1.0 + (adj[a]?.size || 0));
    const scoreB = (weights[b] || 0) / (1.0 + (adj[b]?.size || 0));
    return scoreB - scoreA;
  });

  for (const i of remaining) {
    let conflict = false;
    for (const s of selected) {
      if (adj[i].has(s)) {
        conflict = true;
        break;
      }
    }
    if (!conflict) {
      selected.add(i);
    }
  }

  return selected;
}

/**
 * Simulated Annealing MWIS with Bitmasks
 */
export function saMwisBitmask(
  adj: Set<number>[],
  weights: number[],
  tiers: Set<number>[] = [],
  iters: number = 500,
  seed: number = 42,
  initialTemp: number = 1.0,
  coolingRate: number = 0.995,
  minTemp: number = 0.01
): { selected: Set<number>; weight: number } {
  const n = adj.length;
  const protectedSet = new Set<number>();
  for (const tier of tiers) {
    for (const item of tier) protectedSet.add(item);
  }

  const rng = new DeterministicRNG(seed);
  let sel = new Set(greedyMwisTiered(adj, weights, tiers));
  let best = new Set(sel);
  let bestW = totalWeight(best, weights);

  const adjMask: bigint[] = new Array(n).fill(0n);
  for (let i = 0; i < n; i++) {
    let m = 0n;
    for (const j of adj[i]) {
      m |= 1n << BigInt(j);
    }
    adjMask[i] = m;
  }

  let selMask = 0n;
  for (const i of sel) {
    selMask |= 1n << BigInt(i);
  }

  let T = initialTemp;

  for (let iter = 0; iter < iters; iter++) {
    const movable: number[] = [];
    for (const v of sel) {
      if (!protectedSet.has(v)) movable.push(v);
    }

    if (movable.length === 0) break;

    const v = rng.choice(movable);
    const bitV = 1n << BigInt(v);
    const othersMask = selMask & ~bitV;

    const rejected: number[] = [];
    for (let u = 0; u < n; u++) {
      if ((selMask & (1n << BigInt(u))) === 0n) {
        rejected.push(u);
      }
    }

    const candidates: number[] = [];
    for (const u of rejected) {
      if ((adjMask[u] & othersMask) === 0n) {
        candidates.push(u);
      }
    }

    if (candidates.length === 0) {
      T = Math.max(minTemp, T * coolingRate);
      continue;
    }

    rng.shuffle(candidates);

    let move: { add: number[]; addW: number } | null = null;
    if (candidates.length >= 2) {
      const topCandidates = candidates.slice(0, 12);
      for (let i = 0; i < topCandidates.length; i++) {
        for (let j = i + 1; j < topCandidates.length; j++) {
          const u = topCandidates[i];
          const x = topCandidates[j];
          if ((adjMask[u] & (1n << BigInt(x))) === 0n) {
            move = { add: [u, x], addW: (weights[u] || 0) + (weights[x] || 0) };
            break;
          }
        }
        if (move) break;
      }
    }

    if (!move) {
      const u = candidates[0];
      move = { add: [u], addW: weights[u] || 0 };
    }

    const delta = move.addW - (weights[v] || 0);
    if (delta > 0 || rng.random() < Math.exp(delta / Math.max(T, 1e-6))) {
      sel.delete(v);
      for (const a of move.add) sel.add(a);

      selMask = 0n;
      for (const i of sel) {
        selMask |= 1n << BigInt(i);
      }

      const w = totalWeight(sel, weights);
      if (w > bestW) {
        best = new Set(sel);
        bestW = w;
      }
    }

    T = Math.max(minTemp, T * coolingRate);
  }

  return { selected: best, weight: bestW };
}

/**
 * Main LOGIC Core Solver & Router
 */
export function solveLogic(input: LogicExecutionInput, config: LogicEngineConfig = DEFAULT_LOGIC_CONFIG): LogicExecutionResult {
  const startTime = performance.now();
  const cfg = { ...config, ...(input.configOverride || {}) };

  // 1. Check if 1D geometric route applies
  if (input.points && input.points.length > 0 && typeof input.threshold === "number") {
    const w = input.weights && input.weights.length === input.points.length
      ? input.weights
      : new Array(input.points.length).fill(1.0);

    const { selected, weight } = solveGeometric1D(input.points, w, input.threshold);
    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));
    const selArr = Array.from(selected);

    // Build dummy adj for geometric check
    const adj: Set<number>[] = Array.from({ length: input.points.length }, () => new Set<number>());
    for (let i = 0; i < input.points.length; i++) {
      for (let j = i + 1; j < input.points.length; j++) {
        if (Math.abs(input.points[i] - input.points[j]) <= input.threshold) {
          adj[i].add(j);
          adj[j].add(i);
        }
      }
    }

    const refIds = input.referenceIds || [];
    const states = classifyStates(adj, selected, refIds);

    return buildExecutionResult(
      selArr,
      weight,
      "geometric_1d_exact",
      true,
      executionTimeMs,
      adj,
      states,
      w,
      refIds,
      input.nodeLabels
    );
  }

  // 2. Build or obtain adjacency list
  let adj: Set<number>[] = [];
  if (input.adj) {
    adj = input.adj;
  } else if (input.matrix) {
    adj = buildConflictGraphFromMatrix(input.matrix);
  } else {
    throw new Error("LOGIC Engine: Debes proporcionar adj, matrix o points+threshold.");
  }

  const n = adj.length;
  const weights = input.weights && input.weights.length === n
    ? [...input.weights]
    : new Array(n).fill(1.0);

  // Normalize protected tiers
  const tiers: Set<number>[] = [];
  if (input.tiers && input.tiers.length > 0) {
    for (const t of input.tiers) {
      tiers.push(new Set(t));
    }
  } else if (input.protectedIds && input.protectedIds.length > 0) {
    tiers.push(new Set(input.protectedIds));
  } else if (input.referenceIds && input.referenceIds.length > 0) {
    // Reference authorities automatically placed in tier 0 with dominance weight
    tiers.push(new Set(input.referenceIds));
    for (const ref of input.referenceIds) {
      if (ref >= 0 && ref < weights.length) {
        weights[ref] = cfg.referenceDominanceWeight;
      }
    }
  }

  let chosenSet = new Set<number>();
  let chosenWeight = 0;
  let methodUsed = "";
  let isExact = false;

  // 3. Router decision
  if (cfg.defaultRoute === "bb_bitmask_exact" || (cfg.defaultRoute === "auto" && n <= cfg.bbNodeBudget)) {
    const bbRes = solveBbBitmask(adj, weights, tiers, cfg.timeBudgetSeconds);
    if (!bbRes.timedOut) {
      chosenSet = bbRes.selected;
      chosenWeight = bbRes.weight;
      methodUsed = "bb_bitmask_exact";
      isExact = true;
    } else {
      // Timeout fallback to SA
      const saRes = saMwisBitmask(
        adj,
        weights,
        tiers,
        cfg.saIterations,
        cfg.seed,
        cfg.saInitialTemp,
        cfg.saCoolingRate,
        cfg.saMinTemp
      );
      chosenSet = saRes.selected;
      chosenWeight = saRes.weight;
      methodUsed = "sa_bitmask_heuristic (fallback from bb timeout)";
      isExact = false;
    }
  } else {
    // Simulated Annealing
    const saRes = saMwisBitmask(
      adj,
      weights,
      tiers,
      cfg.saIterations,
      cfg.seed,
      cfg.saInitialTemp,
      cfg.saCoolingRate,
      cfg.saMinTemp
    );
    chosenSet = saRes.selected;
    chosenWeight = saRes.weight;
    methodUsed = "sa_bitmask_heuristic";
    isExact = false;
  }

  const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));
  const refIds = input.referenceIds || [];
  const states = classifyStates(adj, chosenSet, refIds);

  return buildExecutionResult(
    Array.from(chosenSet),
    chosenWeight,
    methodUsed,
    isExact,
    executionTimeMs,
    adj,
    states,
    weights,
    refIds,
    input.nodeLabels
  );
}

function buildExecutionResult(
  selected: number[],
  totalW: number,
  methodUsed: string,
  isExact: boolean,
  executionTimeMs: number,
  adj: Set<number>[],
  states: Record<number, LogicState>,
  weights: number[],
  refIds: number[],
  nodeLabels?: string[]
): LogicExecutionResult {
  const selSet = new Set(selected);
  const refSet = new Set(refIds);

  const counts = { pass: 0, review: 0, reject: 0, reference: 0 };
  for (const s of Object.values(states)) {
    if (s === "PASS") counts.pass++;
    else if (s === "REVIEW") counts.review++;
    else if (s === "REJECT") counts.reject++;
    else if (s === "REFERENCE") counts.reference++;
  }

  const independent = isIndependent(adj, selected);
  let refAuthoritySelected = true;
  for (const ref of refIds) {
    if (!selSet.has(ref)) {
      refAuthoritySelected = false;
      break;
    }
  }

  // Reject requires reference
  let rejectRequiresRef = true;
  for (const [idStr, state] of Object.entries(states)) {
    const id = Number(idStr);
    if (state === "REJECT") {
      const neighbors = adj[id] || new Set();
      let hasRefNeighbor = false;
      for (const r of refIds) {
        if (neighbors.has(r)) {
          hasRefNeighbor = true;
          break;
        }
      }
      if (!hasRefNeighbor) {
        rejectRequiresRef = false;
        break;
      }
    }
  }

  const noRefNoReject = refIds.length === 0 ? counts.reject === 0 : true;

  const nodeDetails = Array.from({ length: adj.length }, (_, i) => {
    let conflictsWithRef = false;
    const neighbors = adj[i] || new Set();
    for (const r of refIds) {
      if (neighbors.has(r)) {
        conflictsWithRef = true;
        break;
      }
    }
    return {
      id: i,
      label: nodeLabels && nodeLabels[i] ? nodeLabels[i] : `Nodo #${i}${refSet.has(i) ? " [REF]" : ""}`,
      weight: weights[i] || 0,
      degree: neighbors.size,
      state: states[i] || "REVIEW",
      conflictsWithRef,
      inSelected: selSet.has(i)
    };
  });

  return {
    selected,
    totalWeight: totalW,
    methodUsed,
    isExact,
    executionTimeMs,
    states,
    counts,
    invariants: {
      isIndependent: independent,
      referenceAuthoritySelected: refAuthoritySelected,
      rejectRequiresReference: rejectRequiresRef,
      noReferenceNoReject: noRefNoReject
    },
    nodeDetails
  };
}
