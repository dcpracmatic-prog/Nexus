import type { NexusResource } from "../components/NexusModules";

/** Seed resources for the product Resources / Management tabs (not agent fleet). */
export const DEFAULT_RESOURCES: NexusResource[] = [
  {
    id: "res-workspace",
    name: "Workspace local",
    type: "project",
    description: "Contexto de trabajo del usuario en esta sesión."
  },
  {
    id: "res-notes",
    name: "Notas / borrador",
    type: "document",
    description: "Documento de trabajo importable explícitamente a una pestaña."
  }
];
