import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { subscribeToAuth, fetchCollection, saveDocument, deleteDocument } from "./lib/firebase";
import { Agent, Project, Workflow, DelegatedJob, VectorDocument, SolidarityTool } from "./types";
import {
  DEFAULT_AGENTS,
  DEFAULT_PROJECTS,
  DEFAULT_WORKFLOWS,
  DEFAULT_VECTOR_DOCS,
  DEFAULT_JOBS,
  DEFAULT_SOLIDARITIES
} from "./data/initialData";
import { Header } from "./components/Header";
import { FailoverBanner } from "./components/FailoverBanner";
import { ProjectManager } from "./components/ProjectManager";
import { WorkflowBuilder } from "./components/WorkflowBuilder";
import { JobDelegationPanel } from "./components/JobDelegationPanel";
import { VectorDatabasePanel } from "./components/VectorDatabasePanel";
import { AgentFleetManager } from "./components/AgentFleetManager";
import { VoiceAssistantModal } from "./components/VoiceAssistantModal";
import { RealTerminal } from "./components/RealTerminal";
import { SolidaritiesList } from "./components/SolidaritiesList";
import { LogicEngineConfigBox } from "./components/LogicEngineConfigBox";
import { DEFAULT_LOGIC_CONFIG, LogicEngineConfig } from "./lib/logicEngine";
import { ValidationLab } from "./components/ValidationLab";
import { RuntimeControlPlane } from "./components/RuntimeControlPlane";
import { NexusModules, NexusModule, NexusResource, NexusConnection } from "./components/NexusModules";
import { NexusSettings, NexusSettingsState } from "./components/NexusSettings";
import { DEFAULT_NEXUS_VISION, NexusVisionState } from "./components/NexusVision";
import { ExitEvaluation } from "../runtime/vision";
import type { ExitReport } from "../runtime/release/analyzer";
import { encryptNexusPackage } from "../runtime/package/nexusPackage";
import { DEFAULT_CAPABILITIES, ExternalCapability } from "../runtime/capabilities";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj-1");
  const [forceLlamaFallback, setForceLlamaFallback] = useState<boolean>(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [lastFallbackReason, setLastFallbackReason] = useState<string>("");
  const [nexusModule, setNexusModule] = useState<NexusModule>("create");
  const [nexusSettings, setNexusSettings] = useState<NexusSettingsState>(() => {
    try { return JSON.parse(localStorage.getItem("nexus_settings") || "null") || { theme: "light", allowNetwork: false, allowExternalPublish: false, allowPersistentExecution: false, profileVisible: false, teamEnabled: false }; }
    catch { return { theme: "light", allowNetwork: false, allowExternalPublish: false, allowPersistentExecution: false, profileVisible: false, teamEnabled: false }; }
  });
  const [sharedByModule, setSharedByModule] = useState<Record<string, string[]>>({ create: [], analyze: [], experiment: [] });
  const [connections, setConnections] = useState<NexusConnection[]>([]);
  const [capabilities, setCapabilities] = useState<ExternalCapability[]>(() => {
    try { return JSON.parse(localStorage.getItem("nexus_capabilities") || "null") || DEFAULT_CAPABILITIES; } catch { return DEFAULT_CAPABILITIES; }
  });
  const [nexusVision, setNexusVision] = useState<NexusVisionState>(() => {
    try { return JSON.parse(localStorage.getItem("nexus_vision") || "null") || DEFAULT_NEXUS_VISION; }
    catch { return DEFAULT_NEXUS_VISION; }
  });
  const [declaredVision, setDeclaredVision] = useState<NexusVisionState>(DEFAULT_NEXUS_VISION);
  const [exitEvaluation, setExitEvaluation] = useState<ExitEvaluation | undefined>(undefined);
  const [exitReport, setExitReport] = useState<ExitReport | undefined>(undefined);

  // Core Data Collections
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [jobs, setJobs] = useState<DelegatedJob[]>(DEFAULT_JOBS);
  const [vectorDocs, setVectorDocs] = useState<VectorDocument[]>(DEFAULT_VECTOR_DOCS);
  const [solidarities, setSolidarities] = useState<SolidarityTool[]>(DEFAULT_SOLIDARITIES);
  const [logicConfig, setLogicConfig] = useState<LogicEngineConfig>(DEFAULT_LOGIC_CONFIG);

  const nexusResources: NexusResource[] = [
    ...projects.map(p => ({ id: p.id, name: p.title, type: "project", description: p.description })),
    ...vectorDocs.map(d => ({ id: d.id, name: d.title, type: "document", description: "Documento/contexto del usuario" })),
    ...agents.map(a => ({ id: a.id, name: a.name, type: "agent", description: a.role }))
  ];

  useEffect(() => {
    document.documentElement.classList.toggle("dark", nexusSettings.theme === "dark");
    localStorage.setItem("nexus_settings", JSON.stringify(nexusSettings));
  }, [nexusSettings]);

  const handleDeclareVision = async (vision: NexusVisionState, evaluation: ExitEvaluation, report?: ExitReport) => {
    setDeclaredVision(vision);
    setExitEvaluation(evaluation);
    setExitReport(report);
    if (user?.uid) { await saveDocument("nexusExit", "declaration", { vision, evaluation, report }, user.uid); }
  };

  const handleVisionChange = async (vision: NexusVisionState) => {
    setNexusVision(vision);
    localStorage.setItem("nexus_vision", JSON.stringify(vision));
    if (user?.uid) await saveDocument("nexusVision", "current", vision, user.uid);
  };

  const handleAddConnection = async (connection: NexusConnection) => {
    setConnections(prev => [...prev, connection]);
    await saveDocument("nexusConnections", connection.id, connection, user?.uid);
  };

  const handleDeleteConnection = async (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    await deleteDocument("nexusConnections", id);
  };

  const handleAddCapability = async (capability: ExternalCapability) => {
    setCapabilities(prev => [capability, ...prev.filter(c => c.id !== capability.id)]);
    localStorage.setItem("nexus_capabilities", JSON.stringify([capability, ...capabilities.filter(c => c.id !== capability.id)]));
    await saveDocument("nexusCapabilities", capability.id, capability, user?.uid);
  };

  const handleToggleCapability = async (id: string) => {
    const target = capabilities.find(c => c.id === id);
    if (!target) return;
    const next = { ...target, enabled: !target.enabled };
    const all = capabilities.map(c => c.id === id ? next : c);
    setCapabilities(all);
    localStorage.setItem("nexus_capabilities", JSON.stringify(all));
    await saveDocument("nexusCapabilities", id, next, user?.uid);
  };

  const handleDeleteCapability = async (id: string) => {
    const all = capabilities.filter(c => c.id !== id);
    setCapabilities(all);
    localStorage.setItem("nexus_capabilities", JSON.stringify(all));
    await deleteDocument("nexusCapabilities", id);
  };

  const handleToggleConnection = async (id: string) => {
    const target = connections.find(c => c.id === id);
    if (!target) return;
    const next = { ...target, enabled: !target.enabled };
    setConnections(prev => prev.map(c => c.id === id ? next : c));
    await saveDocument("nexusConnections", id, next, user?.uid);
  };

  const handleToggleShare = (module: NexusModule, resourceId: string) => {
    setSharedByModule(prev => {
      const current = prev[module] || [];
      return { ...prev, [module]: current.includes(resourceId) ? current.filter(id => id !== resourceId) : [...current, resourceId] };
    });
  };

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load user's data from Firestore
        try {
          const [userProjects, userWorkflows, userAgents, userJobs, userVectorDocs, userConnections] = await Promise.all([
            fetchCollection("projects", currentUser.uid),
            fetchCollection("workflows", currentUser.uid),
            fetchCollection("agents", currentUser.uid),
            fetchCollection("jobs", currentUser.uid),
            fetchCollection("vectorDocuments", currentUser.uid),
            fetchCollection("nexusConnections", currentUser.uid)
          ]);

          if (userProjects.length > 0) setProjects(userProjects as Project[]);
          if (userWorkflows.length > 0) setWorkflows(userWorkflows as Workflow[]);
          if (userAgents.length > 0) setAgents(userAgents as Agent[]);
          if (userJobs.length > 0) setJobs(userJobs as DelegatedJob[]);
          if (userVectorDocs.length > 0) setVectorDocs(userVectorDocs as VectorDocument[]);
          if (userConnections.length > 0) setConnections(userConnections as NexusConnection[]);
          const userCapabilities = await fetchCollection("nexusCapabilities", currentUser.uid);
          if (userCapabilities.length > 0) { setCapabilities(userCapabilities as ExternalCapability[]); localStorage.setItem("nexus_capabilities", JSON.stringify(userCapabilities)); }
          const userVision = await fetchCollection("nexusVision", currentUser.uid);
          if (userVision.length > 0) {
            const currentVision = userVision.find((v: any) => v.id === "current") || userVision[0];
            const restored = (currentVision as any).statement !== undefined ? currentVision : (currentVision as any).data;
            if (restored) { setNexusVision(restored as NexusVisionState); localStorage.setItem("nexus_vision", JSON.stringify(restored)); }
          }
          const exitSaved = await fetchCollection("nexusExit", currentUser.uid);
          const exitDoc = exitSaved?.find((x: any) => x.id === "declaration");
          if (exitDoc?.vision) { setDeclaredVision(exitDoc.vision as NexusVisionState); setExitEvaluation(exitDoc.evaluation as ExitEvaluation); setExitReport(exitDoc.report as ExitReport | undefined); }
        } catch (e) {
          console.warn("Could not fetch remote Firestore collections, using local state:", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handlers for Projects
  const handleCreateProject = async (newProj: Partial<Project>) => {
    const id = `proj-${Date.now()}`;
    const project: Project = {
      id,
      userId: user?.uid,
      title: newProj.title || "Nuevo Proyecto",
      description: newProj.description || "",
      category: newProj.category || "General",
      status: "active",
      priority: newProj.priority || "alta",
      agentIds: newProj.agentIds || ["agent-supervisor"],
      workflowIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: newProj.tags || ["Multi-Agente"]
    };

    setProjects((prev) => [project, ...prev]);
    await saveDocument("projects", id, project, user?.uid);
  };

  // Handlers for Workflows
  const handleSaveWorkflow = async (workflow: Workflow) => {
    setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? workflow : w)));
    await saveDocument("workflows", workflow.id, workflow, user?.uid);
  };

  // Handlers for Delegated Jobs
  const handleJobCreated = async (job: DelegatedJob) => {
    setJobs((prev) => [job, ...prev]);
    if (job.fallbackUsed && job.fallbackReason) {
      setLastFallbackReason(job.fallbackReason);
    }
    await saveDocument("jobs", job.id, job, user?.uid);
  };

  // Handlers for Vector Documents
  const handleAddVectorDocument = async (doc: Partial<VectorDocument>) => {
    const id = `vdoc-${Date.now()}`;
    const newDoc: VectorDocument = {
      id,
      userId: user?.uid,
      projectId: doc.projectId || selectedProjectId,
      title: doc.title || "Documento sin título",
      content: doc.content || "",
      tags: doc.tags || ["Contexto"],
      embedding: doc.embedding || [],
      dimensions: doc.dimensions || 64,
      createdAt: new Date().toISOString(),
      sizeBytes: doc.sizeBytes || 0
    };

    setVectorDocs((prev) => [newDoc, ...prev]);
    await saveDocument("vectorDocuments", id, newDoc, user?.uid);
  };

  const handleDeleteVectorDocument = async (docId: string) => {
    setVectorDocs((prev) => prev.filter((d) => d.id !== docId));
    await deleteDocument("vectorDocuments", docId);
  };

  // Handlers for Agents
  const handleUpdateAgent = async (agent: Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? agent : a)));
    await saveDocument("agents", agent.id, agent, user?.uid);
  };

  const handleAddNewAgent = async (agent: Partial<Agent>) => {
    const id = `agent-${Date.now()}`;
    const newAgent: Agent = {
      id,
      userId: user?.uid,
      name: agent.name || "Nuevo Agente",
      role: agent.role || "Especialista",
      description: agent.description || "",
      model: agent.model || "gemini-3.5-flash",
      thinkingMode: agent.thinkingMode || false,
      systemPrompt: agent.systemPrompt || "Eres un agente especializado.",
      temperature: agent.temperature || 0.2,
      tools: agent.tools || ["observe"],
      avatarColor: agent.avatarColor || "bg-indigo-600",
      iconName: "BrainCircuit",
      stats: {
        runsCompleted: 0,
        avgLatencyMs: 120,
        successRate: 100
      }
    };
    setAgents((prev) => [...prev, newAgent]);
    await saveDocument("agents", id, newAgent, user?.uid);
  };

  // Handlers for Solidarities (Tools, GitHub Repos, MPC, App Actions)
  const handleAddSolidarity = async (newTool: Partial<SolidarityTool>) => {
    const id = `sol-${Date.now()}`;
    const tool: SolidarityTool = {
      id,
      name: newTool.name || "Nueva Herramienta",
      category: newTool.category || "General",
      type: newTool.type || "app_action",
      description: newTool.description || "",
      enabled: true,
      repoUrl: newTool.repoUrl,
      branch: newTool.branch || "main",
      cloneStatus: newTool.type === "github_repo" ? "ready" : undefined,
      endpointUrl: newTool.endpointUrl,
      method: newTool.method || "POST",
      authType: newTool.authType || "none",
      authSecret: newTool.authSecret,
      headers: newTool.headers,
      mcpProtocol: newTool.mcpProtocol,
      mcpToolsProvided: newTool.mcpToolsProvided,
      isTestbenchDemo: false,
      tags: newTool.tags || ["Solidaridad"],
      createdAt: new Date().toISOString(),
      samplePayload: newTool.samplePayload
    };
    setSolidarities((prev) => [tool, ...prev]);
    await saveDocument("solidarities", id, tool, user?.uid);
  };

  const handleToggleSolidarity = async (id: string, enabled: boolean) => {
    setSolidarities((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled } : s))
    );
    const target = solidarities.find((s) => s.id === id);
    if (target) {
      await saveDocument("solidarities", id, { ...target, enabled }, user?.uid);
    }
  };

  const handleDeleteSolidarity = async (id: string) => {
    setSolidarities((prev) => prev.filter((s) => s.id !== id));
    await deleteDocument("solidarities", id);
  };

  const handleSaveNexusSettings = async (newSettings: NexusSettingsState) => {
    setNexusSettings(newSettings);
    if (user?.uid) await saveDocument("systemConfigs", "nexus", newSettings, user.uid);
  };

  const handleExportNexusPackage = async (passphrase: string) => {
    const identity = user?.uid || "local-profile";
    const envelope = await encryptNexusPackage(identity, passphrase, {
      version: "NEXUS-EXIT-ARCHITECTURE-1.0",
      workspaceContext: nexusVision,
      declaredVision,
      exitEvaluation,
      exitReport,
      capabilities,
      identity: { userId: identity },
      settings: nexusSettings,
      resources: nexusResources,
      connections,
      sharedByModule,
      exportedAt: new Date().toISOString()
    });
    const blob = new Blob([JSON.stringify(envelope)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus-project.nexus.pkg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveLogicConfig = async (newConfig: LogicEngineConfig) => {
    setLogicConfig(newConfig);
    if (user?.uid) {
      await saveDocument("systemConfigs", "logicEngine", newConfig, user.uid);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        forceLlamaFallback={forceLlamaFallback}
        setForceLlamaFallback={setForceLlamaFallback}
        onOpenVoice={() => setVoiceModalOpen(true)}
      />

      {/* Failover Status Alert Banner (visible when active or forced) */}
      <FailoverBanner
        forceLlamaFallback={forceLlamaFallback}
        onDisableFallback={() => setForceLlamaFallback(false)}
        lastFallbackReason={lastFallbackReason}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === "runtime" && (
          <RuntimeControlPlane />
        )}

        {currentTab === "nexus" && (
          <NexusModules active={nexusModule} setActive={setNexusModule} resources={nexusResources} sharedByModule={sharedByModule} onToggleShare={handleToggleShare} connections={connections} onAddConnection={handleAddConnection} onDeleteConnection={handleDeleteConnection} onToggleConnection={handleToggleConnection} vision={nexusVision} onVisionChange={handleVisionChange} declaredVision={declaredVision} exitEvaluation={exitEvaluation} userId={user?.uid || "local-profile"} allowExternalPublish={nexusSettings.allowExternalPublish} onDeclareVision={handleDeclareVision} />
        )}

        {currentTab === "settings" && (
          <NexusSettings settings={nexusSettings} onChange={handleSaveNexusSettings} user={user} onExportPackage={handleExportNexusPackage} capabilities={capabilities} onAddCapability={handleAddCapability} onToggleCapability={handleToggleCapability} onDeleteCapability={handleDeleteCapability} />
        )}

        {currentTab === "projects" && (
          <ProjectManager
            projects={projects}
            agents={agents}
            workflows={workflows}
            jobs={jobs}
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setCurrentTab("workflows");
            }}
            onCreateProject={handleCreateProject}
            onNavigateToDelegate={(projId) => {
              if (projId) setSelectedProjectId(projId);
              setCurrentTab("delegate");
            }}
            onNavigateToWorkflows={(projId) => {
              if (projId) setSelectedProjectId(projId);
              setCurrentTab("workflows");
            }}
          />
        )}

        {currentTab === "workflows" && (
          <WorkflowBuilder
            workflows={workflows}
            agents={agents}
            projects={projects}
            vectorDocs={vectorDocs}
            forceLlamaFallback={forceLlamaFallback}
            selectedProjectId={selectedProjectId}
            onSaveWorkflow={handleSaveWorkflow}
            onRunWorkflowSuccess={(result) => {
              if (result.anyFallbackTriggered) {
                setLastFallbackReason("Ejecución en workflow delegada al motor LLaMA.");
              }
            }}
          />
        )}

        {currentTab === "delegate" && (
          <JobDelegationPanel
            jobs={jobs}
            agents={agents}
            projects={projects}
            vectorDocs={vectorDocs}
            forceLlamaFallback={forceLlamaFallback}
            selectedProjectId={selectedProjectId}
            onJobCreated={handleJobCreated}
          />
        )}

        {currentTab === "logic-engine" && (
          <LogicEngineConfigBox
            initialConfig={logicConfig}
            onSaveConfig={handleSaveLogicConfig}
          />
        )}

        {currentTab === "terminal" && (
          <RealTerminal />
        )}

        {currentTab === "validation" && (
          <ValidationLab />
        )}

        {currentTab === "solidarities" && (
          <SolidaritiesList
            solidarities={solidarities}
            onAddSolidarity={handleAddSolidarity}
            onToggleSolidarity={handleToggleSolidarity}
            onDeleteSolidarity={handleDeleteSolidarity}
          />
        )}

        {currentTab === "vectordb" && (
          <VectorDatabasePanel
            vectorDocs={vectorDocs}
            projects={projects}
            onAddDocument={handleAddVectorDocument}
            onDeleteDocument={handleDeleteVectorDocument}
          />
        )}

        {currentTab === "agents" && (
          <AgentFleetManager
            agents={agents}
            onUpdateAgent={handleUpdateAgent}
            onAddNewAgent={handleAddNewAgent}
            forceLlamaFallback={forceLlamaFallback}
          />
        )}
      </main>

      {/* Live Voice Conversation Modal with gemini-3.1-flash-live-preview */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        activeAgentName={agents[0]?.name || "Supervisor Nexus"}
      />
    </div>
  );
}
