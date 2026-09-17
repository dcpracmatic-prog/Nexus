import type { NexusResource } from "../components/NexusModules";

/** Seed catalog entries (no content) — real artifacts are created in CREATE. */
export const DEFAULT_RESOURCES: NexusResource[] = [
  {
    id: "res-workspace",
    name: "Workspace local",
    type: "project",
    description: "Contexto de trabajo del usuario en esta sesión.",
    format: "text",
    createdAt: new Date(0).toISOString()
  }
];

export const RESOURCES_STORAGE_KEY = "nexus_resources_v1";
export const SHARED_STORAGE_KEY = "nexus_shared_by_module_v1";
export const CONNECTIONS_STORAGE_KEY = "nexus_connections_v1";

export function loadResourcesFromStorage(): NexusResource[] {
  try {
    const raw = localStorage.getItem(RESOURCES_STORAGE_KEY);
    if (!raw) return [...DEFAULT_RESOURCES];
    const parsed = JSON.parse(raw) as NexusResource[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_RESOURCES];
    return parsed;
  } catch {
    return [...DEFAULT_RESOURCES];
  }
}

export function persistResources(resources: NexusResource[]): void {
  try {
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(resources));
  } catch {
    /* ignore */
  }
}
