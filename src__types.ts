export type AgentModelType =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite'
  | 'llama-3-8b-fallback'
  | 'logic-mml-engine';

export interface Agent {
  id: string;
  userId?: string;
  name: string;
  role: string;
  description: string;
  model: AgentModelType;
  thinkingMode: boolean;
  systemPrompt: string;
  temperature: number;
  tools: ('morph_ba' | 'hbag_spmm' | 'observe' | 'vector_rag' | 'web_verify' | 'logic_mwis')[];
  avatarColor: string;
  iconName: string;
  stats: {
    runsCompleted: number;
    avgLatencyMs: number;
    successRate: number;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentId: string;
  agentRole: string;
  taskDescription: string;
  systemPrompt?: string;
  model?: AgentModelType;
  highThinking?: boolean;
  lowLatency?: boolean;
  tools?: string[];
  outputArtifactKey?: string;
}

export interface Workflow {
  id: string;
  projectId?: string;
  userId?: string;
  name: string;
  description: string;
  category: 'Optimizacion' | 'Ingenieria' | 'Analitica' | 'Auditoria' | 'General';
  steps: WorkflowStep[];
  status: 'ready' | 'running' | 'idle';
  lastRunAt?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'in-progress' | 'completed' | 'archived';
  agentIds: string[];
  workflowIds: string[];
  createdAt: string;
  updatedAt: string;
  priority: 'alta' | 'media' | 'baja';
  tags: string[];
}

export interface DelegatedJob {
  id: string;
  projectId: string;
  userId?: string;
  title: string;
  description: string;
  assignedAgentIds: string[];
  inputPayload: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  outputResult?: string;
  executionTrace?: {
    stepIndex: number;
    stepName: string;
    agentRole: string;
    modelUsed: string;
    fallbackTriggered: boolean;
    fallbackReason?: string;
    output: string;
    durationMs: number;
    vectorDocsReferenced?: number;
    toolResults?: any;
  }[];
  usedModel?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  durationMs?: number;
  createdAt: string;
  completedAt?: string;
  telemetry?: {
    frictionScore: number;
    regime: string;
    noiseScore: number;
  };
}

export interface VectorDocument {
  id: string;
  projectId?: string;
  userId?: string;
  title: string;
  content: string;
  tags: string[];
  embedding: number[];
  dimensions: number;
  createdAt: string;
  sizeBytes: number;
  similarityScore?: number;
}

export type SolidarityType =
  | 'github_repo'
  | 'mcp_server'
  | 'rest_api'
  | 'sdk_connector'
  | 'app_action'
  | 'deterministic_testbench';

export interface SolidarityTool {
  id: string;
  userId?: string;
  name: string;
  category: string;
  type: SolidarityType;
  description: string;
  enabled: boolean;
  repoUrl?: string;
  branch?: string;
  clonedPath?: string;
  cloneStatus?: 'cloned' | 'ready' | 'pending' | 'failed' | 'not_cloned';
  endpointUrl?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authType?: 'none' | 'bearer' | 'api_key' | 'basic';
  authSecret?: string;
  mcpProtocol?: string;
  mcpToolsProvided?: string[];
  samplePayload?: string;
  isTestbenchDemo?: boolean; // Flag to indicate demonstration testbench vs open production
  createdAt: string;
  tags: string[];
}

export interface TerminalCommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  cwd: string;
  timestamp: string;
}

export interface ActionDispatchResult {
  url: string;
  method: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  durationMs: number;
  success: boolean;
}

export type LogicState = 'PASS' | 'REVIEW' | 'REJECT' | 'REFERENCE';

export type LogicRouterMethod =
  | 'auto'
  | 'bb_bitmask_exact'
  | 'sa_bitmask_heuristic'
  | 'geometric_1d_exact';

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

export interface LogicExecutionInput {
  points?: number[];
  threshold?: number;
  adj?: Set<number>[] | number[][];
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


