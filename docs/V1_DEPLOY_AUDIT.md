# NEXUS V1 — Auditoría de despliegue

## OK en este corte

- El ciclo de salida tiene un único gate de promoción.
- Sin aprobación explícita del usuario, la salida permanece `BLOCKED`.
- Con visión final, evidencia mínima, prueba declarada, estado `PROMOTABLE` y aprobación explícita, el gate llega a `READY` y permite la descarga.
- La descarga entrega el contenido del MVP en claro y un informe JSON independiente.
- `.nexus.pkg` permanece como respaldo interno cifrado.
- Las pestañas no comparten su estado de trabajo automáticamente; el archivo debe introducirse explícitamente en la pestaña destino.
- Las capacidades externas tienen tipo, operaciones y módulos autorizados.
- `Conectar != Autorizar` y `Credencial != Autoridad global` están representados en runtime y UI.
- Las herramientas heredadas de terminal/acciones/clonado están deshabilitadas por defecto mediante `NEXUS_LEGACY_TOOLS_ENABLED=false`.
- `/api/health` permite comprobar el servicio desplegado.

## Pruebas ejecutadas en este entorno

1. Transpilación sintáctica de los archivos modificados: OK.
2. Prueba runtime `tests/releaseGate.test.ts`: OK.
   - release sin aprobación: `BLOCKED`.
   - release aprobado: `READY`.
   - capacidad usada fuera del módulo autorizado: denegada.
   - transferencia: marcada como iniciada por `USER`.
3. `npm run lint` / `npm run build`: no pudieron completarse aquí porque la instalación de dependencias agotó el tiempo disponible y el entorno no contiene `node_modules`. No se debe interpretar esto como una validación positiva del build completo.

## Bloqueadores antes de producción real

### 1. Sandbox real
El Render actual no constituye aislamiento de ejecución arbitraria. No se debe habilitar terminal o ejecución de código arbitrario en producción hasta implementar un sandbox real o aislar esos servicios fuera del proceso principal.

### 2. Gestión de secretos
Las credenciales externas no deben almacenarse en documentos de configuración del cliente ni exponerse al navegador. V1 registra capacidades, pero la gestión de secretos de producción requiere un vault/backend seguro.

### 3. Modelos externos
La interfaz permite registrar capacidades de modelos externos, pero su uso operativo todavía no está cableado a un Action Gate universal. LLaMA local funciona mediante el endpoint existente; en nube requiere un servicio Ollama/modelo accesible por la infraestructura.

### 4. Verificación funcional profunda
El informe V1 analiza señales estáticas. La confirmación de pruebas es declarada por el usuario. Para una V2 de mayor garantía hace falta ejecución aislada reproducible, captura automática de logs, tests y evidencia de runtime.

### 5. Autenticación de API pública
La capacidad de que otra aplicación consuma NEXUS debe exponerse mediante una API de entrada autenticada y con scopes. El servidor actual necesita un contrato API público y autenticación explícita antes de abrirlo a terceros.

### 6. Formato de distribución
V1 descarga el artefacto real en claro y el informe. Para repositorios completos o despliegues de aplicaciones, todavía falta un empaquetador que conserve árbol de archivos, permisos, dependencias y metadatos de build sin convertir el resultado en un único texto.
