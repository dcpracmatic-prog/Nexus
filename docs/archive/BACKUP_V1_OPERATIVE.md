# NEXUS — Respaldo V1 Operativa

Este corte es acumulativo. El estado funcional actual está en `nexus/`; el estado inmediatamente anterior de Vision Architecture 1.0 está preservado en `nexus/history/v4/`, y los cortes anteriores permanecen en `nexus/history/v1`, `nexus/history/v2` y `nexus/history/v3`.

Reglas implementadas en V1:

- nada sale de NEXUS sin un release gate y aprobación explícita;
- lo que entra a una pestaña no se transfiere automáticamente a otra;
- el usuario introduce explícitamente archivos/trabajos en la pestaña destino;
- conectar una capacidad no autoriza su uso;
- la ejecución/persistencia temporal no se convierte en estado guardado sin una acción explícita;
- `.nexus.pkg` es respaldo interno cifrado;
- el MVP de salida se analiza, se informa y, si queda `READY`, se descarga en claro;
- terminal, clonación y dispatch externos heredados quedan deshabilitados por defecto.


## V1 Operativa Completa
Esta revisión añade el sandbox efímero de aplicación/proceso, Action Gate reutilizable, referencias de secretos y endpoints de prueba. No se habilita shell arbitrario. Render se utilizará posteriormente como entorno de compilación/verificación, no como despliegue en esta etapa.

## Corte: arbitraje determinista integrado

El algoritmo de arbitraje determinista queda incorporado directamente al runtime activo. La evaluación de operaciones pasa por `commandGate` y `actionGate`; el algoritmo no se expone como producto, plugin, servicio o herramienta independiente. El estado anterior a esta integración se conserva en `nexus/history/v5/`.
