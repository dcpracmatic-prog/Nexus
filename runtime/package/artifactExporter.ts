/**
 * NEXUS artifact exporter.
 * Esta es la pieza que faltaba en el ciclo de descarga: cuando canPromote()
 * autoriza, esto es lo que efectivamente produce el archivo que el usuario
 * descarga — desencriptado, listo para salir de la plataforma. No es lo
 * mismo que nexusPackage.ts: ese módulo cifra estado PARA GUARDARLO dentro
 * de NEXUS; este módulo prepara el artefacto PARA QUE SALGA.
 *
 * Formato de salida actual: estructura plana serializable (JSON), que es
 * el contenido real y desencriptado del artefacto. La generación de un
 * .zip binario o ejecutable empaquetado es una decisión de formato final
 * todavía no tomada — este módulo es el punto de integración correcto
 * para conectarla cuando se defina, sin volver a tocar releaseGate.ts.
 */
export type ArtifactKind = "code" | "document" | "mixed";

export interface ExportableArtifact {
  format: "nexus.export";
  version: 1;
  userId: string;
  exportedAt: string;
  declaredVision: string;
  kind: ArtifactKind;
  content: unknown;
}

export function buildExportableArtifact(
  userId: string,
  declaredVision: string,
  payload: unknown,
  kind: ArtifactKind = "code"
): ExportableArtifact {
  return {
    format: "nexus.export",
    version: 1,
    userId,
    exportedAt: new Date().toISOString(),
    declaredVision,
    kind,
    content: payload
  };
}


export function serializeExportableArtifact(artifact: ExportableArtifact): string {
  return JSON.stringify(artifact, null, 2);
}
