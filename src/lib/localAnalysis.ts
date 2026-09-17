import { analyzeExitArtifact, type ExitReport } from "../../runtime/release/analyzer";

export interface LocalArtifactAnalysis {
  name: string;
  format: string;
  sizeBytes: number;
  charCount: number;
  lineCount: number;
  wordCount: number;
  structure: {
    headings?: number;
    jsonKeys?: number;
    codeBlocks?: number;
    urls?: number;
    imports?: number;
  };
  risks: string[];
  invariants: string[];
  exitReport: ExitReport;
  summary: string;
}

function detectFormat(name: string, content: string): "markdown" | "json" | "code" | "text" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".json")) return "json";
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|cs)$/i.test(lower)) return "code";
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* fall through */
    }
  }
  if (/^#{1,6}\s/m.test(content) || /```/.test(content)) return "markdown";
  if (/\b(function|const|import|export|class)\b/.test(content)) return "code";
  return "text";
}

function countJsonKeys(content: string): number | undefined {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.keys(parsed).length;
    }
    if (Array.isArray(parsed)) return parsed.length;
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Deterministic analysis — no LLM required.
 * Uses the same static exit analyzer as the gate for evidence consistency.
 */
export function analyzeArtifactLocally(name: string, content: string): LocalArtifactAnalysis {
  const format = detectFormat(name, content);
  const kind = format === "code" ? "code" : format === "markdown" || format === "text" ? "document" : "mixed";
  const exitReport = analyzeExitArtifact(name, content, kind);
  const lines = content.length ? content.split(/\r?\n/) : [];
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const headings = (content.match(/^#{1,6}\s.+/gm) || []).length;
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  const jsonKeys = format === "json" ? countJsonKeys(content) : undefined;

  const risks: string[] = [];
  if (exitReport.evidence.externalCalls.length) {
    risks.push(`URLs / destinos externos: ${exitReport.evidence.externalCalls.length}`);
  }
  if (exitReport.evidence.sideEffects.length) {
    risks.push(...exitReport.evidence.sideEffects);
  }
  if (exitReport.evidence.missingEvidence.length) {
    risks.push(...exitReport.evidence.missingEvidence);
  }
  if (!content.trim()) risks.push("Artefacto vacío.");
  if (content.includes("TODO") || content.includes("FIXME")) {
    risks.push("Marcadores TODO/FIXME presentes.");
  }

  const invariants: string[] = [
    "Análisis estático — no implica ejecución ni éxito.",
    "Sin evidencia de prueba del usuario → no claim de READY.",
    "Render ≠ publish; sólo Exit Gate con aprobación puede promover."
  ];
  if (exitReport.evidence.missingEvidence.length === 0 && content.trim().length >= 20) {
    invariants.push("Evidencia estructural mínima presente para revisión de salida.");
  }

  const summary =
    `${name}: ${exitReport.sizeBytes} bytes · ${lines.length} líneas · formato ${format}. ` +
    `${exitReport.evidence.dependencies.length} imports · ${exitReport.evidence.externalCalls.length} URLs · ` +
    `${risks.length} señales de riesgo.`;

  return {
    name,
    format,
    sizeBytes: exitReport.sizeBytes,
    charCount: content.length,
    lineCount: lines.length,
    wordCount: words,
    structure: {
      headings: format === "markdown" ? headings : undefined,
      jsonKeys,
      codeBlocks: codeBlocks > 0 ? Math.floor(codeBlocks) : undefined,
      urls: exitReport.evidence.externalCalls.length,
      imports: exitReport.evidence.dependencies.length
    },
    risks,
    invariants,
    exitReport,
    summary
  };
}
