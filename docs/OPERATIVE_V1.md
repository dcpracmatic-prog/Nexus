# NEXUS V1 — OPERATIVE CUT

## Alcance implementado

Esta versión convierte los principios de NEXUS en controles operativos sin redefinir las pestañas existentes.

### Frontera de entrada/salida

Una aplicación externa puede consumir NEXUS sólo por interfaces que NEXUS exponga deliberadamente. NEXUS no obtiene autoridad automática sobre la aplicación externa: cualquier recurso externo que NEXUS vaya a usar debe estar registrado como capacidad y autorizado para la operación concreta.

### Aislamiento entre pestañas

- Cada pestaña mantiene su propio estado de importación en memoria de la interfaz.
- Una pestaña no recibe el estado interno de otra automáticamente.
- El usuario introduce explícitamente un archivo o contenido en la pestaña de destino.
- Management registra relaciones como decisiones del usuario; una relación no crea un canal autónomo de memoria entre pestañas.

Regla: `TAB A -> USER -> TAB B`.

### Capacidades externas

Configuración permite registrar modelos, APIs, SDK, MCP, storage, cloud, database, compute y repositories.

Reglas:

- `CONECTAR != AUTORIZAR`
- `CREDENCIAL != AUTORIDAD GLOBAL`
- Una capacidad debe estar habilitada, autorizada para la pestaña y contener la operación solicitada.
- La operación externa requiere aprobación del usuario en el flujo que la solicite.

### Ejecución efímera

El runtime de trabajo de las pestañas no persiste automáticamente la información importada. La persistencia es una acción explícita del usuario.

Esto es una propiedad del runtime NEXUS. No constituye una garantía sobre las prácticas internas de un proveedor externo al que el usuario haya autorizado enviar información.

### Respaldo interno

`.nexus.pkg` continúa siendo el formato de respaldo/estado interno cifrado.

`Guardar PKG != Publicar MVP`.

### Salida de MVP

Render es la superficie de salida controlada.

Flujo operativo:

`MVP -> VISIÓN FINAL -> ANÁLISIS -> EVIDENCIA -> CONSTITUCIÓN -> GATE -> APROBACIÓN -> EXPORTACIÓN SIN CIFRAR`

La V1 descarga el contenido del MVP en claro y, en una segunda descarga, su informe `nexus-report.json`. El gate no genera ninguna descarga cuando la evaluación no llega a `READY`.

## Límites deliberados de V1

- El análisis del artefacto es estático y basado en señales observables; no es una prueba exhaustiva de comportamiento.
- La confirmación de pruebas de la V1 es evidencia declarada por el usuario; no equivale todavía a una ejecución automática completa del MVP.
- El sandbox mostrado por Render sigue siendo conceptual en la interfaz; la ejecución arbitraria de código no se presenta como sandbox seguro.
- La protección de credenciales de terceros y la gestión de secretos de producción todavía requieren un backend dedicado.
- La salida JSON es un formato de interoperabilidad V1, no un empaquetador universal de ejecutables.

## Condición de despliegue

La aplicación debe publicarse como V1 operativa sólo después de verificar `npm install`, `npm run lint` y `npm run build` en un entorno con dependencias instaladas. En este corte no se pudo completar la instalación local de dependencias dentro del entorno de auditoría.

## Arbitraje determinista interno

El algoritmo de arbitraje determinista está integrado en el runtime de NEXUS como parte de la evaluación de operaciones. No constituye un producto, servicio, plugin ni herramienta externa. Su función es resolver observaciones compatibles, detectar conflictos de contexto y hacer cumplir los rechazos de alta severidad sobre capacidades protegidas antes de permitir una acción.

La decisión de ejecución sigue dependiendo del Gatekeeper/Action Gate y de la autoridad del usuario. El algoritmo no ejecuta acciones ni adquiere autoridad propia.
