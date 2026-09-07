/**
 * NEXUS CONSTITUTION
 * Invariantes no editables por el usuario ni por los modelos.
 */
export const NEXUS_CONSTITUTION = Object.freeze({
  version: "1.0",
  invariants: [
    "NO_EXPLICIT_MALICIOUS_INTENT",
    "NO_THIRD_PARTY_HARM",
    "NO_EXTERNAL_SYSTEM_HARM",
    "NO_SILENT_AUTHORITY",
    "NO_UNDECLARED_RELEASE"
  ] as const
});

export type ConstitutionalInvariant = typeof NEXUS_CONSTITUTION.invariants[number];

export interface ConstitutionalFinding {
  invariant: ConstitutionalInvariant;
  violated: boolean;
  evidence?: string;
}

export function evaluateConstitution(findings: ConstitutionalFinding[] = []): ConstitutionalFinding[] {
  return [...findings];
}

import { analyzeEmbeddedCode } from "./embeddedCodeAnalysis";

/**
 * Material observable sobre el artefacto que el usuario declara listo para salir.
 * Cada campo es evidencia que YA existe en el sistema (excedente observado,
 * side effects declarados, texto de la visión) — esta función no infiere
 * intención nueva, solo la compara contra los cinco invariantes fijos.
 *
 * documentContent es opcional y solo aplica cuando el artefacto exportado
 * es de tipo documento/documentación: si contiene código embebido que
 * resulta funcionalmente completo (ver embeddedCodeAnalysis.ts), ese código
 * se incorpora a la misma revisión — no se crea un invariante nuevo, se
 * amplía qué texto se compara contra los ya existentes. La razón: el
 * formato "documento" no debe ser una forma de eludir la revisión que ya
 * se le aplicaría al mismo código si se exportara como código puro.
 */
export interface ConstitutionalReviewInput {
  declaredVision: string;
  observedExcess: string[];
  declaredSideEffects: string[];
  scope: "sandbox" | "artifact" | "resource" | "project" | "unknown";
  hasExplicitUserApproval: boolean;
  documentContent?: string;
}

const MALICIOUS_MARKERS = [
  "ransomware", "keylogger", "exfiltrar credenciales", "malware",
  "denegación de servicio", "ddos", "explotar vulnerabilidad", "backdoor"
];
const THIRD_PARTY_HARM_MARKERS = [
  "sin consentimiento", "espiar", "vigilancia encubierta", "acosar", "suplantar identidad"
];
const EXTERNAL_SYSTEM_HARM_MARKERS = [
  "borrar producción", "sobrescribir sistema externo", "acceso no autorizado", "escalar privilegios"
];

function textContainsAny(text: string, markers: string[]): string | undefined {
  const lower = text.toLowerCase();
  return markers.find(m => lower.includes(m));
}

/**
 * Evalúa el material observable de un artefacto contra los cinco invariantes
 * de NEXUS_CONSTITUTION. No sustituye evaluateExit() ni gateOperation(); es la
 * pieza que faltaba para que "violated" en ConstitutionalFinding deje de
 * depender de que alguien más lo calcule fuera del runtime.
 */
export function reviewAgainstConstitution(input: ConstitutionalReviewInput): ConstitutionalFinding[] {
  const embeddedCode = input.documentContent ? analyzeEmbeddedCode(input.documentContent) : undefined;
  const embeddedCodeToReview = embeddedCode?.looksFunctionallyComplete ? [embeddedCode.combinedCode] : [];

  const combinedText = [
    input.declaredVision,
    ...input.declaredSideEffects,
    ...input.observedExcess,
    ...embeddedCodeToReview
  ].join(" \n ");

  const maliciousHit = textContainsAny(combinedText, MALICIOUS_MARKERS);
  const thirdPartyHit = textContainsAny(combinedText, THIRD_PARTY_HARM_MARKERS);
  const externalHarmHit = textContainsAny(combinedText, EXTERNAL_SYSTEM_HARM_MARKERS);
  const undeclaredEmbeddedCode = !!embeddedCode?.looksFunctionallyComplete && input.scope !== "artifact";
  const silentAuthority = (input.declaredSideEffects.length === 0 && input.observedExcess.length > 0) || undeclaredEmbeddedCode;
  const undeclaredRelease = !input.hasExplicitUserApproval;

  return [
    { invariant: "NO_EXPLICIT_MALICIOUS_INTENT", violated: !!maliciousHit, evidence: maliciousHit },
    { invariant: "NO_THIRD_PARTY_HARM", violated: !!thirdPartyHit, evidence: thirdPartyHit },
    { invariant: "NO_EXTERNAL_SYSTEM_HARM", violated: !!externalHarmHit, evidence: externalHarmHit },
    {
      invariant: "NO_SILENT_AUTHORITY",
      violated: silentAuthority,
      evidence: silentAuthority
        ? (undeclaredEmbeddedCode
            ? "El documento contiene código funcionalmente completo no declarado como artefacto de código."
            : "Hay excedente observado sin side effects declarados por el usuario.")
        : undefined
    },
    {
      invariant: "NO_UNDECLARED_RELEASE",
      violated: undeclaredRelease,
      evidence: undeclaredRelease ? "No existe aprobación explícita del usuario para esta salida." : undefined
    }
  ];
}
