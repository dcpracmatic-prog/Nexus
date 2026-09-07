# NEXUS — Respaldo acumulativo / Vision Architecture 1.0

Esta versión se construye sobre el `Nexus.zip` consolidado anterior. No reemplaza ni aplana el historial.

Cambios principales:
- La antigua visión inicial pasa a ser `Contexto de trabajo`.
- Se incorpora `Preparar salida` como momento explícito de declaración final.
- Se incorpora evaluación determinista de salida.
- Se incorpora Constitución NEXUS como conjunto de invariantes.
- Se incorpora estado de promoción separado de validación.
- El paquete incluye contexto, visión declarada y evaluación de salida.
- Se marca la arquitectura conceptual en `docs/FUNDAMENTALES.md`.
- Se incorpora el acta formal en `docs/ACTA_CONCEPTO_NEXUS.md`.

Regla de continuidad: la siguiente versión debe partir de este respaldo acumulativo, conservar su árbol completo y añadir cambios sobre `nexus/`; nunca sustituir el historial previo.
