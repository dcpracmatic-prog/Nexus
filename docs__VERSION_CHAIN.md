# NEXUS — Cadena acumulativa

`V1 histórica -> V2 -> V3 -> V4 Vision Architecture -> V1 Operativa -> V1 Operativa + Arbitraje Determinista`

Este ZIP conserva:

- `history/v1`: snapshot histórico V1.
- `history/v2`: snapshot histórico V2.
- `history/v3`: snapshot consolidado previo.
- `nexus/history/v4`: snapshot exacto del estado inmediatamente anterior a esta V1 operativa.
- `nexus/history/v5`: snapshot del estado V1 Operativa Completa inmediatamente anterior a la integración del arbitraje determinista.
- `nexus/`: estado funcional actual.

Toda versión futura debe partir de `nexus/` de este corte y añadir cambios sin sustituir la cadena histórica.


## Corte actual

El algoritmo de arbitraje determinista está integrado directamente en los puntos de decisión del runtime (`commandGate` y `actionGate`). No se expone como herramienta, producto, plugin ni servicio independiente.
