import { Agent, Project, Workflow, VectorDocument, DelegatedJob, SolidarityTool } from "../types";

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: "agent-supervisor",
    name: "Supervisor Nexus",
    role: "Orquestador de Flujos & Síntesis",
    description: "Coordina agentes especialistas, valida que las conclusiones distingan observación de demostración y activa respaldo LLaMA si detecta anomalías.",
    model: "gemini-3.1-pro-preview",
    thinkingMode: true,
    systemPrompt: "Eres el supervisor de un sistema multi-agente. Tu misión es descomponer objetivos, delegar tareas a agentes especialistas, contrastar evidencias deterministas y nunca inventar datos.",
    temperature: 0.2,
    tools: ["observe", "vector_rag", "web_verify"],
    avatarColor: "bg-indigo-600",
    iconName: "BrainCircuit",
    stats: {
      runsCompleted: 142,
      avgLatencyMs: 380,
      successRate: 99.2
    }
  },
  {
    id: "agent-morph",
    name: "MORPH Graph Solver",
    role: "Especialista en Grafos & MIS",
    description: "Ejecuta algoritmos combinatorios sobre grafos Barabási-Albert para resolver Maximum Independent Set bajo presupuestos de tiempo estrictos.",
    model: "gemini-3.5-flash",
    thinkingMode: false,
    systemPrompt: "Eres el especialista en grafos y Maximum Independent Set (MIS). Reporta soluciones factibles obtenidas por MORPH. No afirmes optimalidad matemática absoluta sin una prueba formal determinista independiente.",
    temperature: 0.1,
    tools: ["morph_ba", "vector_rag"],
    avatarColor: "bg-emerald-600",
    iconName: "Network",
    stats: {
      runsCompleted: 89,
      avgLatencyMs: 140,
      successRate: 98.7
    }
  },
  {
    id: "agent-hbag",
    name: "HBAG SpMM Accelerator",
    role: "Especialista en Computación Rala & SpMM",
    description: "Evalúa multiplicación de matrices dispersas (Sparse x Dense) con núcleos adaptativos, midiendo precisión numérica, nnz y tiempos.",
    model: "gemini-3.1-flash-lite",
    thinkingMode: false,
    systemPrompt: "Eres el especialista de rendimiento numérico y multiplicación SpMM. Reporta dimensiones, densidad, tiempo en milisegundos y error numérico absoluto.",
    temperature: 0.1,
    tools: ["hbag_spmm"],
    avatarColor: "bg-amber-600",
    iconName: "Cpu",
    stats: {
      runsCompleted: 115,
      avgLatencyMs: 95,
      successRate: 100.0
    }
  },
  {
    id: "agent-logic",
    name: "LOGIC MML Arbiter",
    role: "Árbitro Causal & Resolutor MWIS",
    description: "Ejecuta el motor LOGIC MML de sistema para resolver conjuntos independientes de peso máximo, bitmasks exactos/heurísticos y particionar estados en PASS, REVIEW y REJECT.",
    model: "logic-mml-engine",
    thinkingMode: false,
    systemPrompt: "Eres el árbitro del motor LOGIC MML de sistema. Aplica invariantes causales estrictas: el conjunto seleccionado debe ser independiente, la autoridad de referencia no puede violarse, y sin referencia no existe REJECT.",
    temperature: 0.0,
    tools: ["logic_mwis", "observe"],
    avatarColor: "bg-slate-900",
    iconName: "Binary",
    stats: {
      runsCompleted: 64,
      avgLatencyMs: 12,
      successRate: 100.0
    }
  },
  {
    id: "agent-edge",
    name: "Edge Observer Sentinel",
    role: "Guardrails & Telemetría AOM",
    description: "Analiza flujos de salida con SWAR, calcula fricción y ruido, detecta regímenes de inestabilidad y aplica filtros anti-alucinación.",
    model: "gemini-3.1-flash-lite",
    thinkingMode: false,
    systemPrompt: "Eres el agente Edge Observer. Auditas telemetría de eventos, evalúas fricción y recomiendas planes de reconfiguración. Recuerda: la observación no sustituye la demostración formal.",
    temperature: 0.2,
    tools: ["observe", "vector_rag"],
    avatarColor: "bg-cyan-600",
    iconName: "ShieldCheck",
    stats: {
      runsCompleted: 210,
      avgLatencyMs: 82,
      successRate: 99.8
    }
  },
  {
    id: "agent-llama-fallback",
    name: "LLaMA Resilient Node",
    role: "Motor de Respaldo Local (Failover)",
    description: "Toma el control inmediato si la API de Gemini sufre desconexión, 429 quota o latencias altas. Ejecuta lógica estructurada con CPU o inferencia local.",
    model: "llama-3-8b-fallback",
    thinkingMode: false,
    systemPrompt: "Eres el nodo de respaldo local LLaMA. Garantizas la continuidad operativa de los flujos de trabajo sin depender de servicios externos de nube.",
    temperature: 0.3,
    tools: ["morph_ba", "hbag_spmm", "observe"],
    avatarColor: "bg-rose-600",
    iconName: "ServerCrash",
    stats: {
      runsCompleted: 45,
      avgLatencyMs: 210,
      successRate: 100.0
    }
  }
];

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "Optimización de Topologías Barabási-Albert",
    description: "Evaluación heurística de conjuntos independientes máximos (MIS) con el motor MORPH para clusters de telecomunicaciones y grafos de conectividad.",
    category: "Optimizacion Combinatoria",
    status: "active",
    agentIds: ["agent-supervisor", "agent-morph", "agent-edge"],
    workflowIds: ["wf-1"],
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-04T07:15:00Z",
    priority: "alta",
    tags: ["Graph Theory", "MORPH", "MIS", "Edge Observer"]
  },
  {
    id: "proj-2",
    title: "Benchmark Matricial SpMM en Arquitecturas Heterogéneas",
    description: "Evaluación de multiplicación dispersa sobre densa utilizando HBAG y contrastando tiempos de ejecución con librerías estándar en CPU y aceleradores.",
    category: "Computacion de Alto Rendimiento",
    status: "in-progress",
    agentIds: ["agent-supervisor", "agent-hbag", "agent-edge"],
    workflowIds: ["wf-2"],
    createdAt: "2026-09-02T14:30:00Z",
    updatedAt: "2026-09-04T06:40:00Z",
    priority: "media",
    tags: ["SpMM", "HBAG", "Sparse", "AVX2"]
  },
  {
    id: "proj-3",
    title: "Auditoría Autónoma de Guardrails en Tiempo Real",
    description: "Sistema de supervisión continua de salidas generativas de agentes para prevenir alucinaciones mediante cálculo de fricción SWAR y membranas AOM.",
    category: "Seguridad y Telemetria",
    status: "active",
    agentIds: ["agent-supervisor", "agent-edge", "agent-llama-fallback"],
    workflowIds: ["wf-3"],
    createdAt: "2026-09-03T09:00:00Z",
    updatedAt: "2026-09-04T07:10:00Z",
    priority: "alta",
    tags: ["Guardrails", "SWAR", "AOM Membrane", "Failover"]
  }
];

export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: "wf-1",
    projectId: "proj-1",
    name: "Pipeline de Resolución y Verificación MIS",
    description: "Orquesta la formulación del problema de grafos, ejecuta la búsqueda factible con MORPH y audita los parámetros con Edge Observer.",
    category: "Optimizacion",
    status: "ready",
    createdAt: "2026-09-01T12:00:00Z",
    steps: [
      {
        id: "step-1-1",
        name: "Descomposición y Análisis de Grafo",
        agentId: "agent-supervisor",
        agentRole: "Supervisor",
        taskDescription: "Analiza las restricciones del problema de grafos y define la configuración inicial para Barabási-Albert (n vértices y presupuesto ms).",
        highThinking: true,
        model: "gemini-3.1-pro-preview"
      },
      {
        id: "step-1-2",
        name: "Ejecución Heurística MORPH",
        agentId: "agent-morph",
        agentRole: "MORPH Specialist",
        taskDescription: "Ejecuta MORPH sobre el grafo generado para obtener la solución factible de Maximum Independent Set respetando el presupuesto de tiempo.",
        model: "gemini-3.5-flash",
        tools: ["morph_ba"]
      },
      {
        id: "step-1-3",
        name: "Auditoría Determinista y Guardrails",
        agentId: "agent-edge",
        agentRole: "Edge Observer",
        taskDescription: "Inspecciona la salida para asegurar que no se afirme maximalidad absoluta sin verificación formal e incorpora telemetría de fricción.",
        lowLatency: true,
        model: "gemini-3.1-flash-lite",
        tools: ["observe"]
      }
    ]
  },
  {
    id: "wf-2",
    projectId: "proj-2",
    name: "Evaluación y Validación SpMM HBAG",
    description: "Genera matriz rala sintética, ejecuta multiplicación HBAG y valida tolerancias numéricas contra referencias matriciales.",
    category: "Ingenieria",
    status: "ready",
    createdAt: "2026-09-02T15:00:00Z",
    steps: [
      {
        id: "step-2-1",
        name: "Especificación de Densidad y Dimensiones",
        agentId: "agent-supervisor",
        agentRole: "Supervisor",
        taskDescription: "Determina tamaño n=512, k=64 y densidad 0.02 para evaluación en memoria L3.",
        model: "gemini-3.5-flash"
      },
      {
        id: "step-2-2",
        name: "Cálculo SpMM Acelerado",
        agentId: "agent-hbag",
        agentRole: "HBAG Specialist",
        taskDescription: "Ejecuta HBAG SpMM determinista con hilos adaptativos y calcula el error máximo contra SciPy.",
        lowLatency: true,
        model: "gemini-3.1-flash-lite",
        tools: ["hbag_spmm"]
      }
    ]
  }
];

export const DEFAULT_VECTOR_DOCS: VectorDocument[] = [
  {
    id: "vdoc-1",
    projectId: "proj-1",
    title: "Manual Técnico: Algoritmo MORPH y Maximum Independent Set",
    content: "MORPH es un solver heurístico para grafos Barabási-Albert y de escala libre. Para grafos no dirigidos G=(V,E), un conjunto independiente I es un subconjunto de vértices tal que ninguna arista conecta dos vértices de I. El problema de determinar el conjunto de cardinalidad máxima es NP-difícil. MORPH emplea búsqueda greedy con presupuestos de tiempo en milisegundos y semillas deterministas. Regla fundamental: una solución encontrada es factible; nunca debe declararse probadamente óptima sin una demostración o verificador independiente.",
    tags: ["MORPH", "Grafos", "MIS", "NP-Hard", "Algoritmos"],
    embedding: [],
    dimensions: 64,
    createdAt: "2026-09-01T09:00:00Z",
    sizeBytes: 642
  },
  {
    id: "vdoc-2",
    projectId: "proj-2",
    title: "Arquitectura HBAG: Multiplicación de Matrices Ralas (SpMM)",
    content: "HBAG (Hierarchical Block Adaptive Grid) optimiza la multiplicación de matrices dispersas A (formato CSR/HBAG) por matrices densas B (SpMM: C = A x B). Utiliza bloqueado jerárquico adaptado al tamaño de caché L1/L2/L3 y vectorización AVX2 con instrucciones FMA para minimizar accesos no contiguos a memoria DRAM. La precisión numérica se valida calculando la diferencia máxima absoluta (max_error < 1e-4) contra el producto canónico de SciPy.",
    tags: ["HBAG", "SpMM", "CSR", "AVX2", "Algebra Lineal"],
    embedding: [],
    dimensions: 64,
    createdAt: "2026-09-02T11:00:00Z",
    sizeBytes: 574
  },
  {
    id: "vdoc-3",
    projectId: "proj-3",
    title: "Especificación de Guardrails y Telemetría: Edge Observer",
    content: "Edge Observer implementa la arquitectura de ciclo cerrado para agentes autónomos. Integra la membrana AOM (Adaptive Observability Membrane) y el motor SWAR. Mide en tiempo real dos métricas críticas: factor de ruido (noise score) y fricción operativa (friction score). Si la fricción supera el umbral de 0.65, el sistema clasifica el régimen como INESTABLE y dispara planes de reconfiguración (ajuste de temperatura o activación de LLaMA de respaldo).",
    tags: ["Edge Observer", "SWAR", "Membrana AOM", "Guardrails", "Telemetria"],
    embedding: [],
    dimensions: 64,
    createdAt: "2026-09-03T08:30:00Z",
    sizeBytes: 618
  },
  {
    id: "vdoc-4",
    projectId: "proj-1",
    title: "Protocolo de Respaldo LLaMA / Failover de Emergencia",
    content: "En caso de indisponibilidad de la API externa de Gemini (por cuotas excedidas, latencia superior a 15000ms o desconexión de red), el controlador activa el nodo de respaldo LLaMA local. El nodo LLaMA utiliza un template ChatML estructurado y ejecuta las mismas herramientas deterministas (MORPH, HBAG, Edge Observer), manteniendo la continuidad del flujo de trabajo y registrando la causa del failover.",
    tags: ["LLaMA", "Failover", "Resiliencia", "Alta Disponibilidad", "Local"],
    embedding: [],
    dimensions: 64,
    createdAt: "2026-09-03T16:00:00Z",
    sizeBytes: 520
  }
];

export const DEFAULT_JOBS: DelegatedJob[] = [
  {
    id: "job-101",
    projectId: "proj-1",
    title: "Resolver MIS sobre Barabási-Albert n=4096 y 50ms",
    description: "Delegación de cálculo de conjunto independiente con MORPH y verificación estricta de afirmaciones sin sesgo.",
    assignedAgentIds: ["agent-supervisor", "agent-morph", "agent-edge"],
    inputPayload: "Ejecutar análisis sobre grafo Barabási-Albert con 4096 vértices y presupuesto de 50 ms. Semilla 12345.",
    status: "completed",
    usedModel: "gemini-3.1-pro-preview",
    fallbackUsed: false,
    durationMs: 460,
    outputResult: "El análisis de MORPH ha encontrado una solución factible de tamaño 20465 vértices (4096 vértices base). Tiempo de ejecución del algoritmo: 6.73ms (dentro del límite de 50ms). Conforme a las directivas de verificación, se declara como solución factible, sin prueba formal de maximalidad absoluta.",
    createdAt: "2026-09-04T06:10:00Z",
    completedAt: "2026-09-04T06:10:01Z",
    telemetry: {
      frictionScore: 0.32,
      regime: "ESTABLE",
      noiseScore: 0.18
    }
  }
];

export const DEFAULT_SOLIDARITIES: SolidarityTool[] = [
  {
    id: "sol-logic",
    name: "LOGIC MML — Motor Combinatorio de Invariantes",
    category: "MML de Sistema",
    type: "app_action",
    description: "Motor MML de Sistema para resolución determinista de Conjunto Independiente de Peso Máximo (MWIS), enrutamiento B&B/SA por bitmasks y partición causal de estados (PASS, REVIEW, REJECT).",
    enabled: true,
    endpointUrl: "/api/engine/logic/solve",
    method: "POST",
    authType: "none",
    isTestbenchDemo: false,
    samplePayload: JSON.stringify({
      matrix: [
        [false, true, false, false],
        [true, false, true, false],
        [false, true, false, true],
        [false, false, true, false]
      ],
      weights: [1.0, 2.5, 1.0, 1e12],
      referenceIds: [3],
      nodeLabels: ["Candidato Directo", "Conflicto Par", "Candidato Lateral", "Autoridad Referencia [R]"]
    }, null, 2),
    tags: ["MML de Sistema", "LOGIC Core", "Invariantes Causales", "MWIS", "Bitmask"],
    createdAt: "2026-09-06T00:00:00Z"
  },
  {
    id: "sol-1",
    name: "MORPH Barabási-Albert Testbench",
    category: "Optimizacion Combinatoria",
    type: "deterministic_testbench",
    description: "Banco de pruebas demostrativo (Testbench Benchmark) para aproximación heurística del problema NP-hard Maximum Independent Set (MIS) sobre grafos BA.",
    enabled: true,
    isTestbenchDemo: true,
    tags: ["Demostración", "Benchmark", "NP-Hard", "Grafos"],
    createdAt: "2026-09-01T10:00:00Z",
    samplePayload: JSON.stringify({ n: 2048, ms: 25, seed: 42 }, null, 2)
  },
  {
    id: "sol-2",
    name: "HBAG SpMM Benchmark Core",
    category: "Computación Rala & Álgebra",
    type: "deterministic_testbench",
    description: "Banco de pruebas demostrativo (Testbench Benchmark) de multiplicación matricial dispersa (SpMM) con matrices sintéticas y perfilado numérico de latencia.",
    enabled: true,
    isTestbenchDemo: true,
    tags: ["Demostración", "Benchmark", "SpMM", "Álgebra"],
    createdAt: "2026-09-01T10:00:00Z",
    samplePayload: JSON.stringify({ n: 512, k: 64, density: 0.02, threads: 2 }, null, 2)
  },
  {
    id: "sol-3",
    name: "GitHub: Awesome Multi-Agent Tools",
    category: "Herramientas GitHub",
    type: "github_repo",
    description: "Herramientas solidarias clonables desde GitHub con scripts utilitarios, webhooks y parsers de datos para flujos autónomos.",
    enabled: true,
    repoUrl: "https://github.com/octocat/Spoon-Knife.git",
    branch: "main",
    cloneStatus: "ready",
    isTestbenchDemo: false,
    tags: ["GitHub", "Git Clone", "Open Source", "Scripts"],
    createdAt: "2026-09-02T14:00:00Z"
  },
  {
    id: "sol-4",
    name: "Servidor MPC / Model Context Protocol",
    category: "Protocolos MPC",
    type: "mcp_server",
    description: "Servidor con protocolo MCP (Model Context Protocol) para conectar agentes con sistemas de archivos, bases de datos remotas y memoria compartida.",
    enabled: true,
    endpointUrl: "http://localhost:3000/api/mcp",
    mcpProtocol: "json-rpc-2.0",
    mcpToolsProvided: ["fs_read", "fs_write", "fetch_api", "sql_query"],
    isTestbenchDemo: false,
    tags: ["MPC", "JSON-RPC", "Protocolo Abierto"],
    createdAt: "2026-09-03T11:00:00Z"
  },
  {
    id: "sol-5",
    name: "Despachador de Acciones de tu Aplicación (Webhooks / REST)",
    category: "Integración de Aplicaciones",
    type: "app_action",
    description: "Conector directo para ejecutar acciones reales en tu backend o aplicación web (disparar eventos, actualizar registros, enviar notificaciones).",
    enabled: true,
    endpointUrl: "https://httpbin.org/post",
    method: "POST",
    authType: "bearer",
    authSecret: "app_token_live_preview",
    headers: { "X-Nexus-Origin": "NexusAgent-Studio" },
    samplePayload: JSON.stringify({ event: "AGENT_ACTION_DISPATCHED", project: "Alpha", action: "trigger_sync" }, null, 2),
    isTestbenchDemo: false,
    tags: ["Producción Libre", "Acciones en Apps", "Webhooks", "REST"],
    createdAt: "2026-09-03T15:30:00Z"
  },
  {
    id: "sol-6",
    name: "SDK Connector / API Gateway Genérico",
    category: "SDKs & APIs Externas",
    type: "sdk_connector",
    description: "Punto de conexión para cualquier SDK personalizado (Stripe, Twilio, Slack, AWS, HuggingFace o microservicios propios).",
    enabled: true,
    endpointUrl: "https://api.github.com/zen",
    method: "GET",
    authType: "none",
    isTestbenchDemo: false,
    tags: ["SDKs", "APIs", "Microservicios"],
    createdAt: "2026-09-04T09:00:00Z"
  }
];

