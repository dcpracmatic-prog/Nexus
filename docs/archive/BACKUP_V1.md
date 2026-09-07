# NexusAgent Studio — Respaldo V1 / Corte de Caja

Fecha del corte: 2026-09-06
Base: última versión empaquetada `NexusAgent-Studio-validation-lab.zip`.

## Propósito

Este archivo congela el estado funcional y conceptual alcanzado hasta este punto. No mezcla funcionalidades propuestas con funcionalidades ya implementadas.

## Arquitectura reconsolidada V1

```text
USUARIO
  autoridad máxima sobre la intención
      │
      ▼
LLaMA LOCAL
  comprensión de intención · análisis de riesgo · aclaración · redirección segura
      │
      ▼
LOGIC
  invariantes · conflictos · arbitraje determinista · PASS/REVIEW/REJECT/REFERENCE
      │
      ▼
TDCP / GATEKEEPER
  autorización criptográfica sobre recursos protegidos
      │
      ▼
SANDBOX
  espacio mutable y desechable para experimentación
      │
      ▼
VERIFICACIÓN
  pruebas · métricas · auditoría · decisión de consolidación
      │
      ├── FAIL / VIOLACIÓN → STOP + RESET DESDE BASE
      │
      └── PASS → candidato, nunca consolidado por defecto
```

## Principios fijados

1. El usuario conserva la autoridad máxima sobre la intención.
2. LLaMA no es la autoridad final. Interpreta, detecta riesgo, pregunta y propone rutas seguras.
3. LOGIC es el guardián determinista de invariantes, relaciones, conflictos y restricciones.
4. TDCP/Gatekeeper protege recursos y documentos mediante autorización separada del contenido.
5. El sandbox es el único lugar donde debe permitirse la mutación experimental.
6. La base original debe poder reconstruirse de manera determinista.
7. Un intento de comprometer el sistema, una violación de invariantes o una condición crítica debe detener la ejecución y provocar restauración desde la base.
8. La consolidación no ocurre por defecto. Primero existe un candidato verificable y después una promoción explícita.
9. La evidencia del experimento queda fuera del estado mutable para que un reset no borre la trazabilidad.
10. Las etiquetas de evaluación no entran en la decisión de LOGIC.

## Estado funcional de la entrega congelada

### Ya implementado

- Pestaña `Ajustes / Laboratorio`.
- Subida de CSV, JSON, JSONL, TXT, MD, LOG y aceptación de PDF por extensión.
- Solicitud de validación en lenguaje natural.
- Endpoint de LLaMA local vía Ollama.
- Fallback local determinista cuando Ollama no está disponible.
- Motor LOGIC TypeScript integrado en el pipeline de validación.
- Contexto `proto + service + state` cuando existe en los datos.
- Separación `PASS / REVIEW / REJECT / REFERENCE`.
- Invariantes expuestas en el resultado.
- Las etiquetas presentes se registran para evaluación posterior y no se usan para decidir.
- Terminal real integrada en la interfaz.
- Endpoint de ejecución de terminal existente.
- Botón de parada de validación preparado.

### Parcial / requiere endurecimiento

- La traza del Laboratorio muestra comandos representacionales (`inspect`, `validation --mode=synthetic-smoke`), pero la validación todavía no ejecuta esos nombres como comandos reales del sistema.
- `activeLlamaProcess` existe, pero la llamada HTTP a Ollama no está enlazada todavía a un proceso cancelable; el cliente puede abortar la solicitud, pero el backend no garantiza la cancelación física de Ollama.
- La terminal real usa `exec()` con bloqueo de unos pocos comandos destructivos; no constituye todavía un sandbox de seguridad.
- El endpoint de terminal acepta `cwd` arbitrario existente del proceso; todavía no está forzado a un root aislado.
- La validación de documentos es estructural para datos tabulares; no existe todavía un pipeline semántico general de PDF/documentos.
- La interfaz todavía conserva la organización original de multi-agente/proyectos y no se ha reducido al nuevo modelo LAB/EXPERIMENTS/SYSTEM/SETTINGS.

### No implementado todavía; queda fijado como V1 de diseño

- Sandbox real aislado por experimento.
- Snapshots, clones, rollback y destrucción/recreación automática del sandbox.
- Gestor de experimentos con baseline/candidate/diff/metrics/tests.
- Mutaciones controladas por LLaMA mediante operaciones estructuradas.
- Guard de comandos centralizado que entregue cada operación a LOGIC antes de ejecutar.
- Protocolo de hasta cinco preguntas aclaratorias de intención.
- Generación de alternativas seguras que preserven el objetivo del usuario.
- Detección conjunta LLaMA + LOGIC con detención crítica.
- Reset automático del sandbox ante violación crítica.
- TDCP y Gatekeeper integrados al runtime.
- Protección de archivos/documentos de origen y de artefactos derivados.
- Grants, epoch, anti-replay y revocación conectados al flujo real de ejecución.
- Consolidación/promotion gate explícito.
- Reinicio desde una base conocida antes de una nueva experimentación.
- Auditoría de intent, autorización, comando, resultado, violación y reset.
- Streaming de procesos mediante `spawn`/SSE/WebSocket con control real de proceso.

## Regla de consolidación fijada

```text
SANDBOX → CANDIDATE → VALIDATION → LOGIC → USER APPROVAL → PROMOTION
```

Nunca:

```text
SANDBOX → producción
```

Y ante violación crítica:

```text
VIOLATION → STOP → INVALIDATE → DESTROY SANDBOX → RECREATE FROM BASE
```

## Regla de autoridad

```text
Usuario: define el objetivo.
LLaMA: interpreta la intención y negocia rutas seguras.
LOGIC: verifica restricciones e invariantes.
TDCP: autoriza el uso de recursos protegidos.
Gatekeeper: hace cumplir la autorización.
Sandbox: ejecuta lo permitido de forma aislada.
```

## Evaluación del corte

La versión congelada ya tiene una base funcional para la idea: LLaMA local + LOGIC + laboratorio + terminal + evidencia visible. La innovación arquitectónica nueva está definida, pero no debe presentarse como implementada hasta construir el aislamiento real, el control de procesos, el protocolo de intención y la integración TDCP/Gatekeeper.
