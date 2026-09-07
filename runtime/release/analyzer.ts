import { analyzeEmbeddedCode } from "../constitution/embeddedCodeAnalysis";

export interface ExitEvidence {
  codeInventory: string[];
  dependencies: string[];
  sideEffects: string[];
  externalCalls: string[];
  fileOperations: string[];
  executionSignals: string[];
  missingEvidence: string[];
  contentFingerprint: string;
  observedExcess: string[];
}

export interface ExitReport {
  reportVersion: "1.0";
  artifactName: string;
  artifactKind: "code" | "document" | "mixed";
  contentFingerprint: string;
  sizeBytes: number;
  summary: string;
  evidence: ExitEvidence;
}

const IMPORT_RE = /\b(?:import\s+[^;\n]+|from\s+["'][^"']+["']|require\(["'][^"']+["']\))/g;
const URL_RE = /\bhttps?:\/\/[^\s"'`<>]+/gi;
const FILE_RE = /\b(?:fs\.|readFile|writeFile|unlink|open\(|path\.)/gi;
const EXEC_RE = /\b(?:exec\(|execFile\(|spawn\(|child_process)/gi;
const NET_RE = /\b(?:fetch\(|axios\.|WebSocket\(|XMLHttpRequest)/gi;

function unique(values: string[]): string[] { return [...new Set(values)]; }

function fingerprint(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

export function analyzeExitArtifact(artifactName: string, content: string, kind: ExitReport["artifactKind"] = "code"): ExitReport {
  const text = content || "";
  const embedded = kind !== "code" ? analyzeEmbeddedCode(text) : undefined;
  const effectiveCode = kind === "code" ? text : (embedded?.looksFunctionallyComplete ? embedded.combinedCode : "");
  const imports = unique((effectiveCode.match(IMPORT_RE) || []).map(x => x.trim())).slice(0, 50);
  const urls = unique((text.match(URL_RE) || []).map(x => x.trim())).slice(0, 50);
  const fileOps = unique((effectiveCode.match(FILE_RE) || []).map(x => x.trim())).slice(0, 30);
  const execOps = unique((effectiveCode.match(EXEC_RE) || []).map(x => x.trim())).slice(0, 30);
  const netOps = unique((effectiveCode.match(NET_RE) || []).map(x => x.trim())).slice(0, 30);

  const sideEffects = [
    ...(fileOps.length ? ["Operaciones potenciales de filesystem detectadas."] : []),
    ...(execOps.length ? ["Ejecución de procesos detectada."] : []),
    ...(netOps.length || urls.length ? ["Comunicación de red detectada."] : [])
  ];

  const missingEvidence: string[] = [];
  const contentFingerprint = fingerprint(text);
  if (!text.trim()) missingEvidence.push("El artefacto está vacío.");
  if (text.trim().length < 20) missingEvidence.push("El artefacto es demasiado pequeño para una revisión útil.");
  if (kind === "document" && embedded && embedded.looksFunctionallyComplete) missingEvidence.push("El documento contiene código funcional que debe revisarse como artefacto.");

  const executionSignals = [
    ...(execOps.length ? ["EXEC_PROCESS"] : []),
    ...(fileOps.length ? ["FILESYSTEM"] : []),
    ...(netOps.length || urls.length ? ["NETWORK"] : []),
    ...(effectiveCode.match(/\b(?:main\(|if\s*\(\s*require\.main|__main__)\b/) ? ["ENTRYPOINT"] : [])
  ];

  return {
    reportVersion: "1.0",
    artifactName,
    artifactKind: kind,
    contentFingerprint,
    sizeBytes: new TextEncoder().encode(text).byteLength,
    summary: `Análisis estático V1: ${text.length} caracteres, ${imports.length} dependencias/imports observados, ${sideEffects.length} categorías de side effects y ${urls.length} destinos externos observados.`,
    evidence: {
      codeInventory: effectiveCode ? ["contenido principal disponible", ...(effectiveCode.includes("{") ? ["bloques con estructura de código"] : [])] : [],
      dependencies: imports,
      sideEffects,
      externalCalls: urls,
      fileOperations: fileOps,
      executionSignals,
      missingEvidence,
      contentFingerprint,
      observedExcess: []
    }
  };
}
