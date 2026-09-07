# NEXUS Sandbox V1

El sandbox V1 es efímero y seguro por defecto a nivel de aplicación: cada sesión tiene un directorio temporal propio, preferentemente en `/dev/shm` (memoria compartida) cuando el host lo proporciona, TTL, límites de entrada/salida, ejecución acotada y red DENY.

No existe una ruta pública para ejecutar comandos shell arbitrarios. Las únicas operaciones expuestas son `INSPECT`, `JSON_VALIDATE`, `TEXT_ANALYZE` y `RUN_REGISTERED`, donde la última ejecuta únicamente una tarea registrada por NEXUS.

Esto evita que el prompt del usuario o un modelo convierta el servidor en un terminal remoto. El sandbox destruye su directorio al expirar o mediante cierre explícito.

Importante: este componente es una barrera de aplicación y proceso, no un contenedor de seguridad de kernel. Para ejecutar código arbitrario no confiable, la V1 de producción debe añadir aislamiento de contenedor/VM dedicado y políticas de red a nivel de infraestructura. NEXUS debe fallar cerrado si esa capacidad no está disponible.

En el despliegue objetivo se establece `NEXUS_REQUIRE_MEMORY_SANDBOX=true`; si no existe `/dev/shm`, la creación del sandbox falla en lugar de degradar silenciosamente a disco.
