/**
 * Detecta si el código embebido dentro de un documento (no un artefacto
 * de código puro) constituye, por sí solo, algo ejecutable de principio a
 * fin — en vez de medir proporción o longitud de caracteres.
 *
 * Por qué así: la intención declarada no es impedir que alguien copie y
 * pegue manualmente lo que ve en pantalla (eso siempre fue y sigue siendo
 * posible, es libre albedrío del usuario fuera de NEXUS). La intención es
 * que el formato "documento" no se use como vehículo para transportar,
 * sin pasar por la misma revisión de intención que ya aplica al código,
 * un artefacto funcional completo disfrazado de texto explicativo.
 *
 * Un fragmento ilustrativo, incompleto, o dependiente de contexto externo
 * no faltante no dispara esto. Un conjunto de fragmentos que, unidos,
 * ya correrían sin cambios adicionales, sí lo hace.
 */

const CODE_FENCE_RE = /```[\w-]*\n([\s\S]*?)```/g;

export interface EmbeddedCodeAnalysis {
  codeBlocks: string[];
  combinedCode: string;
  looksFunctionallyComplete: boolean;
  completenessSignals: string[];
}

const COMPLETENESS_SIGNALS: Array<{ label: string; test: (code: string) => boolean }> = [
  { label: "declara imports/requires propios", test: c => /\b(import\s+.+from|require\()/m.test(c) },
  { label: "define función(es) completas de inicio a fin", test: c => /\bfunction\s+\w+\s*\(|=>\s*{[\s\S]*?}/m.test(c) },
  { label: "incluye punto de entrada ejecutable", test: c => /\bif\s*\(\s*require\.main|__main__|\bmain\s*\(\s*\)/m.test(c) },
  { label: "no depende de variables/contexto sin definir en el propio bloque", test: c => !/\.\.\.|TODO|<[A-Z_]+>|\bpendiente\b/i.test(c) }
];

export function analyzeEmbeddedCode(documentText: string): EmbeddedCodeAnalysis {
  const codeBlocks: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(CODE_FENCE_RE);
  while ((match = re.exec(documentText)) !== null) {
    codeBlocks.push(match[1].trim());
  }

  const combinedCode = codeBlocks.join("\n\n");
  const signals = COMPLETENESS_SIGNALS.filter(s => s.test(combinedCode)).map(s => s.label);

  // Se considera funcionalmente completo si hay código Y se cumplen al
  // menos tres de las cuatro señales de completitud — un solo indicio
  // (por ejemplo, un import suelto en un ejemplo ilustrativo) no basta.
  const looksFunctionallyComplete = combinedCode.length > 0 && signals.length >= 3;

  return { codeBlocks, combinedCode, looksFunctionallyComplete, completenessSignals: signals };
}
