# NEXUS — Respaldo V3 Consolidado

Fecha: 2026-09-06
Tipo: respaldo acumulativo

## Regla de continuidad

Este respaldo NO sustituye las versiones anteriores. V3 se construye acumulativamente sobre V1 + V2 + V3.

El directorio `nexus/` contiene el estado funcional consolidado de V3. Los directorios `history/v1/` y `history/v2/` contienen copias exactas de los estados anteriores para preservar cualquier trabajo histórico que haya sido reemplazado por cambios posteriores.

Cadena de consolidación:

`V1 → V2 → V3 → NEXUS`

## Estado de implementación

La incorporación de V3 mantiene las capacidades y componentes heredados de V1/V2 y añade las superficies NEXUS, Settings y el paquete `.nexus.pkg`. La existencia de una capacidad en el respaldo no implica que sea producción-segura; las limitaciones técnicas permanecen documentadas en `docs/V3_AUDIT.md`.

## Principio

Cada respaldo futuro debe partir de este `Nexus.zip` y sumar cambios sobre el estado consolidado. No se debe reconstruir una versión nueva desde una copia conceptual o desde una versión parcial.
