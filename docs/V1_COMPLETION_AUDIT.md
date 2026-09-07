# NEXUS V1 — Auditoría previa a compilación en Render

## Implementado

1. Separación de pestañas: no existe intercambio automático de contexto.
2. Transferencia entre pestañas: requiere acción explícita del usuario.
3. Capacidades externas: registradas por tipo, módulo y operación.
4. Action Gate: decisión centralizada y deny-by-default.
5. Sandbox: sesión efímera, TTL, límites de entrada/salida, filesystem temporal y red declarada DENY.
6. Shell arbitrario: bloqueado en la superficie pública de sandbox.
7. Ejecución registrada: limitada a una tarea fija del runtime.
8. Release Gate: visión final + evidencia + análisis + Constitución + aprobación explícita.
9. `.nexus.pkg`: respaldo interno, no salida MVP.
10. MVP: sólo se entrega después de autorización del Release Gate.
11. Secretos: el estado de NEXUS usa referencias de entorno, no valores de credencial.
12. Health check Render y configuración de compilación presentes.
13. Pruebas de runtime para Release Gate, Sandbox y Action Gate presentes.

## Límite deliberado

El sandbox V1 no afirma ser un aislamiento de kernel/VM. Por tanto, NEXUS no permite ejecutar código arbitrario no confiable. Antes de habilitar esa función debe existir un runner de contenedor/VM dedicado con red denegada por infraestructura, límites de CPU/memoria/PID, filesystem de sólo trabajo y destrucción posterior.

## Qué se probará con Render

`npm ci` → `npm run build` → `npm run test:runtime` → arranque del servidor → `/api/health`.

Los fallos de dependencias, TypeScript, Vite, esbuild, Express y compatibilidad Node se corregirán sobre esta misma versión acumulativa. Ningún respaldo histórico se reemplaza.

## Integración del arbitraje determinista

El algoritmo de arbitraje quedó incorporado al runtime activo de NEXUS. Se utiliza dentro de `commandGate` y `actionGate`; no existe como producto o herramienta externa. La integración conserva la separación entre interpretación, autoridad, decisión y ejecución.
