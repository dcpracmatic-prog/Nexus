import { reviewAgainstConstitution, ConstitutionalReviewInput } from "../constitution";
import { evaluateExit, ExitEvaluation } from "../vision";
import { canPromote, PromotionState } from "./index";
import { buildExportableArtifact, ExportableArtifact, ArtifactKind } from "../package/artifactExporter";
import { analyzeExitArtifact, ExitReport } from "../release/analyzer";

/**
 * Datos que el usuario y el sistema ya tienen en el momento en que se pide
 * descargar/empaquetar/exportar un artefacto. Nada aquí se infiere: son los
 * mismos insumos que evaluateExit() y reviewAgainstConstitution() ya esperaban
 * por separado — este módulo solo los encadena en el orden que definimos:
 * visión declarada = código = revisión constitucional = cumplimiento de
 * políticas = descarga autorizada.
 *
 * kind identifica si lo que se exporta es código, documentación o mixto.
 * documentContent solo aplica cuando kind es "document" o "mixed": es el
 * texto completo del documento, que reviewAgainstConstitution analiza en
 * busca de código embebido funcionalmente completo (ver
 * constitution/embeddedCodeAnalysis.ts) antes de autorizar la salida.
 */
export interface ReleaseRequest {
  userId: string;
  declaredVision: string;
  evidenceAvailable: boolean;
  testsPassed: boolean;
  observedExcess: string[];
  declaredSideEffects: string[];
  scope: ConstitutionalReviewInput["scope"];
  hasExplicitUserApproval: boolean;
  promotionState: PromotionState;
  payload: unknown;
  kind?: ArtifactKind;
  documentContent?: string;
  artifactName?: string;
  testEvidence?: string[];
  analysis?: ExitReport;
}

export interface ReleaseResult {
  authorized: boolean;
  exitEvaluation: ExitEvaluation;
  artifact?: ExportableArtifact;
  reasons: string[];
  report?: ExitReport;
}

/**
 * Único punto de entrada para "descargar/empaquetar/exportar". Si algo no
 * cumple, no autoriza y no genera ningún artefacto — el bloque permanece
 * disponible dentro de la plataforma, solo no cruza hacia afuera.
 */
export function requestRelease(req: ReleaseRequest): ReleaseResult {
  const report = req.analysis ?? analyzeExitArtifact(
    req.artifactName || "nexus-artifact",
    req.documentContent || (typeof req.payload === "string" ? req.payload : JSON.stringify(req.payload)),
    req.kind ?? "code"
  );

  const evidenceAvailable = req.evidenceAvailable && report.evidence.missingEvidence.length === 0 && report.contentFingerprint.length > 0;
  const constitutionalFindings = reviewAgainstConstitution({
    declaredVision: req.declaredVision,
    observedExcess: [...req.observedExcess, ...report.evidence.observedExcess],
    declaredSideEffects: [...req.declaredSideEffects, ...report.evidence.sideEffects],
    scope: req.scope,
    hasExplicitUserApproval: req.hasExplicitUserApproval,
    documentContent: req.kind !== "code" ? (req.documentContent || "") : undefined
  });

  const exitEvaluation = evaluateExit({
    declaredVision: req.declaredVision,
    evidenceAvailable,
    testsPassed: req.testsPassed && (req.testEvidence?.length ?? 0) > 0,
    observedExcess: [...req.observedExcess, ...report.evidence.observedExcess],
    constitutionalFindings
  });

  const authorized = canPromote(req.promotionState, req.hasExplicitUserApproval, exitEvaluation);

  if (!authorized) {
    const reasons = [...exitEvaluation.reasons, ...report.evidence.missingEvidence, ...(req.testEvidence?.length ? [] : ["No existe evidencia de prueba marcada por el usuario."])];
    return { authorized: false, exitEvaluation, reasons: [...new Set(reasons)], report };
  }

  const artifact = buildExportableArtifact(req.userId, req.declaredVision, req.payload, req.kind ?? "code");
  return { authorized: true, exitEvaluation, artifact, reasons: [], report };
}
