# V1 — Checklist de completitud antes de Render

- [x] Sandbox efímero con TTL y filesystem temporal aislado por sesión.
- [x] Shell arbitrario bloqueado en la API pública.
- [x] Operaciones registradas y acotadas.
- [x] Action Gate universal como módulo reutilizable.
- [x] Capacidades externas separadas de autoridad.
- [x] Referencias de secretos, no credenciales crudas en estado de proyecto.
- [x] Release Gate conectado a análisis + Constitución + aprobación.
- [x] MVP externo separado del respaldo `.nexus.pkg`.
- [x] Pruebas automáticas de sandbox y Action Gate.
- [x] Health check y configuración Render.
- [ ] Aislamiento de kernel/container para ejecución arbitraria de código: fuera del alcance seguro de esta V1; requerido antes de permitir código no confiable.
- [ ] Persistencia PostgreSQL/Key Value: no necesaria para compilar; requerida para una operación multiinstancia persistente.
- [ ] Autenticación de API pública: requerida antes de exponer endpoints de ejecución a terceros.
