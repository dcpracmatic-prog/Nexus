# Arquitectura funcional V1

## 1. Modelo de control

El sistema se organiza como una cadena de funciones, no como una jerarquía donde una IA sustituye al usuario.

- Usuario: autoridad máxima sobre el objetivo/intención.
- LLaMA: guardián semántico. Puede detectar ambigüedad, malicia aparente, riesgo operacional y proponer una reinterpretación segura.
- LOGIC: guardián determinista. Verifica invariantes, conflictos, dependencia y restricciones de ejecución.
- TDCP: autoridad criptográfica sobre recursos protegidos.
- Gatekeeper: único camino de acceso a recursos que requieran autorización.
- Sandbox: entorno mutable, aislado y descartable.

## 2. Protocolo de intención

Cuando la solicitud presenta riesgo o ambigüedad suficiente:

1. LLaMA explica la incertidumbre/riesgo.
2. Formula una pregunta concreta de intención.
3. Ofrece opciones de objetivo o rutas seguras.
4. Se repite hasta un máximo de cinco preguntas.
5. La intención resultante se convierte en una operación estructurada.
6. LOGIC evalúa esa operación.
7. Solo una operación permitida llega al sandbox.

La finalidad de las preguntas es reducir incertidumbre, no desgastar al usuario ni revocar su autoridad.

## 3. Operación estructurada propuesta

```json
{
  "intent": "objetivo reconstruido",
  "operation": "tipo de operación",
  "target": "recurso o componente",
  "scope": "sandbox-id",
  "risk": "low|medium|high|critical",
  "tests": ["..."],
  "expected": {"metric": "..."},
  "requires_resource_grant": true
}
```

LLaMA puede proponer esta estructura, pero no debe escribir directamente sobre el host fuera de la política.

## 4. Sandbox

Cada experimento debería tener un root propio, por ejemplo:

```text
sandbox/<experiment-id>/
  workspace/
  baseline/
  candidate/
  datasets/
  tests/
  artifacts/
  metrics/
  patches/
  logs/
```

La base del sistema queda fuera del root mutable. La recuperación debe crear el sandbox desde una copia de baseline verificable.

## 5. Reset

Un reset crítico debe ser un evento de runtime, no una sugerencia de LLaMA.

```text
risk/violation
      ↓
policy decision
      ↓
STOP PROCESS
      ↓
INVALIDATE CANDIDATE
      ↓
PRESERVE AUDIT
      ↓
DESTROY SANDBOX
      ↓
RECREATE FROM BASE
```

## 6. TDCP/Gatekeeper

TDCP debe permanecer separado de la decisión lógica.

LOGIC responde: “¿esta operación está permitida bajo las restricciones del sistema?”

TDCP/Gatekeeper responde: “¿este sujeto/proceso tiene una autorización válida para usar este recurso protegido en este contexto?”

El recurso protegido nunca debe depender de que el sandbox sea considerado confiable por sí mismo.

## 7. Artefactos

Los resultados que sobreviven al sandbox deben registrarse como artefactos versionados.

```text
sandbox result
   ↓
artifact
   ↓
metadata
   ├── provenance
   ├── experiment-id
   ├── tests
   ├── metrics
   ├── logic decision
   └── resource grants, when applicable
```

Un nuevo sandbox no hereda automáticamente grants del anterior.

## 8. Consolidación

La promoción de un candidato es una operación posterior al experimento y requiere validación adicional y aprobación explícita del usuario. El sistema no debe asumir que “PASS” equivale a “promover”.
