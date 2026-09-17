import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { subscribeToAuth, fetchCollection, saveDocument, deleteDocument } from "./lib/firebase";
import { Header } from "./components/Header";
import { NexusModules, NexusModule, NexusResource, NexusConnection } from "./components/NexusModules";
import { NexusSettings, NexusSettingsState } from "./components/NexusSettings";
import { DEFAULT_NEXUS_VISION, NexusVisionState } from "./components/NexusVision";
import { ExitEvaluation } from "../runtime/vision";
import type { ExitReport } from "../runtime/release/analyzer";
import { encryptNexusPackage } from "../runtime/package/nexusPackage";
import { DEFAULT_CAPABILITIES, ExternalCapability } from "../runtime/capabilities";
import { DEFAULT_RESOURCES } from "./data/initialData";

const DEFAULT_SETTINGS: NexusSettingsState = {
  theme: "light",
  allowNetwork: false,
  allowExternalPublish: false,
  allowPersistentExecution: false,
  profileVisible: false,
  teamEnabled: false
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("nexus");
  const [nexusModule, setNexusModule] = useState<NexusModule>("create");
  const [nexusSettings, setNexusSettings] = useState<NexusSettingsState>(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_settings") || "null") || DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [sharedByModule, setSharedByModule] = useState<Record<string, string[]>>({
    create: [],
    analyze: [],
    experiment: []
  });
  const [connections, setConnections] = useState<NexusConnection[]>([]);
  const [capabilities, setCapabilities] = useState<ExternalCapability[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_capabilities") || "null") || DEFAULT_CAPABILITIES;
    } catch {
      return DEFAULT_CAPABILITIES;
    }
  });
  const [nexusVision, setNexusVision] = useState<NexusVisionState>(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_vision") || "null") || DEFAULT_NEXUS_VISION;
    } catch {
      return DEFAULT_NEXUS_VISION;
    }
  });
  const [declaredVision, setDeclaredVision] = useState<NexusVisionState>(DEFAULT_NEXUS_VISION);
  const [exitEvaluation, setExitEvaluation] = useState<ExitEvaluation | undefined>(undefined);
  const [exitReport, setExitReport] = useState<ExitReport | undefined>(undefined);
  const [nexusResources, setNexusResources] = useState<NexusResource[]>(DEFAULT_RESOURCES);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", nexusSettings.theme === "dark");
    localStorage.setItem("nexus_settings", JSON.stringify(nexusSettings));
  }, [nexusSettings]);

  const handleDeclareVision = async (
    vision: NexusVisionState,
    evaluation: ExitEvaluation,
    report?: ExitReport
  ) => {
    setDeclaredVision(vision);
    setExitEvaluation(evaluation);
    setExitReport(report);
    if (user?.uid) {
      await saveDocument("nexusExit", "declaration", { vision, evaluation, report }, user.uid);
    }
  };

  const handleVisionChange = async (vision: NexusVisionState) => {
    setNexusVision(vision);
    localStorage.setItem("nexus_vision", JSON.stringify(vision));
    if (user?.uid) await saveDocument("nexusVision", "current", vision, user.uid);
  };

  const handleAddConnection = async (connection: NexusConnection) => {
    setConnections((prev) => [...prev, connection]);
    await saveDocument("nexusConnections", connection.id, connection, user?.uid);
  };

  const handleDeleteConnection = async (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    await deleteDocument("nexusConnections", id);
  };

  const handleAddCapability = async (capability: ExternalCapability) => {
    const all = [capability, ...capabilities.filter((c) => c.id !== capability.id)];
    setCapabilities(all);
    localStorage.setItem("nexus_capabilities", JSON.stringify(all));
    await saveDocument("nexusCapabilities", capability.id, capability, user?.uid);
  };

  const handleToggleCapability = async (id: string) => {
    const target = capabilities.find((c) => c.id === id);
    if (!target) return;
    const next = { ...target, enabled: !target.enabled };
    const all = capabilities.map((c) => (c.id === id ? next : c));
    setCapabilities(all);
    localStorage.setItem("nexus_capabilities", JSON.stringify(all));
    await saveDocument("nexusCapabilities", id, next, user?.uid);
  };

  const handleDeleteCapability = async (id: string) => {
    const all = capabilities.filter((c) => c.id !== id);
    setCapabilities(all);
    localStorage.setItem("nexus_capabilities", JSON.stringify(all));
    await deleteDocument("nexusCapabilities", id);
  };

  const handleToggleConnection = async (id: string) => {
    const target = connections.find((c) => c.id === id);
    if (!target) return;
    const next = { ...target, enabled: !target.enabled };
    setConnections((prev) => prev.map((c) => (c.id === id ? next : c)));
    await saveDocument("nexusConnections", id, next, user?.uid);
  };

  const handleToggleShare = (module: NexusModule, resourceId: string) => {
    setSharedByModule((prev) => {
      const current = prev[module] || [];
      return {
        ...prev,
        [module]: current.includes(resourceId)
          ? current.filter((id) => id !== resourceId)
          : [...current, resourceId]
      };
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return;
      try {
        const [userConnections, userCapabilities, userVision, exitSaved, userResources] =
          await Promise.all([
            fetchCollection("nexusConnections", currentUser.uid),
            fetchCollection("nexusCapabilities", currentUser.uid),
            fetchCollection("nexusVision", currentUser.uid),
            fetchCollection("nexusExit", currentUser.uid),
            fetchCollection("nexusResources", currentUser.uid)
          ]);

        if (userConnections.length > 0) setConnections(userConnections as NexusConnection[]);
        if (userCapabilities.length > 0) {
          setCapabilities(userCapabilities as ExternalCapability[]);
          localStorage.setItem("nexus_capabilities", JSON.stringify(userCapabilities));
        }
        if (userResources.length > 0) setNexusResources(userResources as NexusResource[]);
        if (userVision.length > 0) {
          const currentVision =
            userVision.find((v: { id?: string }) => v.id === "current") || userVision[0];
          const restored =
            (currentVision as { statement?: string }).statement !== undefined
              ? currentVision
              : (currentVision as { data?: NexusVisionState }).data;
          if (restored) {
            setNexusVision(restored as NexusVisionState);
            localStorage.setItem("nexus_vision", JSON.stringify(restored));
          }
        }
        const exitDoc = exitSaved?.find((x: { id?: string }) => x.id === "declaration") as
          | { vision?: NexusVisionState; evaluation?: ExitEvaluation; report?: ExitReport }
          | undefined;
        if (exitDoc?.vision) {
          setDeclaredVision(exitDoc.vision);
          setExitEvaluation(exitDoc.evaluation);
          setExitReport(exitDoc.report);
        }
      } catch (e) {
        console.warn("Could not fetch remote Firestore collections, using local state:", e);
      }
    });

    return () => unsubscribe();
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === "nexus" && (
          <NexusModules
            active={nexusModule}
            setActive={setNexusModule}
            resources={nexusResources}
            sharedByModule={sharedByModule}
            onToggleShare={handleToggleShare}
            connections={connections}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onToggleConnection={handleToggleConnection}
            vision={nexusVision}
            onVisionChange={handleVisionChange}
            declaredVision={declaredVision}
            exitEvaluation={exitEvaluation}
            userId={user?.uid || "local-profile"}
            allowExternalPublish={nexusSettings.allowExternalPublish}
            onDeclareVision={handleDeclareVision}
          />
        )}

        {currentTab === "settings" && (
          <NexusSettings
            settings={nexusSettings}
            onChange={handleSaveNexusSettings}
            user={user}
            onExportPackage={handleExportNexusPackage}
            capabilities={capabilities}
            onAddCapability={handleAddCapability}
            onToggleCapability={handleToggleCapability}
            onDeleteCapability={handleDeleteCapability}
          />
        )}
      </main>
    </div>
  );
}
