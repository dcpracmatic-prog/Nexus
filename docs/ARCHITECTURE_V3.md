# NEXUS™ — Arquitectura V3

Fecha: 2026-09-06
Base: NexusAgent Studio Concept V2.

## 1. Dirección del producto

NEXUS™ evoluciona desde un AI Studio orientado a agentes hacia un runtime de creación computacional asistida. El objeto central es la transformación controlada de recursos mediante operaciones, relaciones, autoridad y evidencia.

Principios de producto:
- Nada es perfecto. Avanzamos compartiendo lo bueno.
- Una visión clara + interacción estratégica = creación cada vez más certera.
- La intención pertenece al usuario.
- La interacción descubre posibilidades; la evidencia respalda afirmaciones.
- Crear no implica publicar.
- Renderizar no implica exponer.
- Ejecutar no implica autorizar acceso al exterior.
- PASS no equivale a viabilidad general.

## 2. Módulos independientes

Las superficies funcionales son dominios especializados. No tienen autoridad implícita sobre los demás. La información sólo cruza módulos cuando el usuario la comparte o cuando existe una relación explícitamente autorizada.

- CREATE: construcción desde intención.
- ANALYZE: observación, hechos, inferencias, faltantes y riesgos.
- EXPERIMENT: mutación temporal y descartable.
- RESOURCES: inventario, procedencia y permisos de recursos.
- MANAGEMENT: relaciones entre piezas, intención, alcance y operaciones permitidas.
- RENDER: observación/previsualización aislada de aplicaciones, APIs, SDKs, librerías, documentos, PDFs, imágenes, datos y otros artefactos.
- SETTINGS: identidad, permisos, tema y colaboración.

Las herramientas legacy permanecen disponibles durante la transición, pero no constituyen el modelo conceptual final.

## 3. Management y relaciones

Una conexión es una entidad explícita:

`SOURCE -> TARGET + INTENT + SCOPE + OPERATIONS + AUTHORITY + CONDITIONS`

El usuario decide qué piezas se conectan y por qué. El runtime sólo ejecuta una relación si las reglas y autoridad la permiten.

Relaciones iniciales: `depends_on`, `consumes`, `produces`, `derives_from`, `protected_by`, `validated_by`.

## 4. Contención frente al mundo exterior

El cifrado no se define principalmente como protección intelectual. Su función primaria es impedir que el estado persistente de las creaciones sea directamente utilizable por el mundo exterior sin pasar por el runtime autorizado.

El modelo es una doble frontera:

`EXTERIOR -> GATE -> NEXUS -> SANDBOX`

`SANDBOX -> PROMOTION GATE -> GATE -> EXTERIOR`

El paquete persistente `.nexus.pkg` permanece encapsulado. El sandbox proporciona aislamiento operativo; el cifrado proporciona encapsulación persistente. Ninguno, por separado, debe considerarse una frontera completa.

## 5. Promoción

`INTERNAL -> EXPERIMENT -> CANDIDATE -> VALIDATED -> PROMOTION REVIEW -> EXTERNAL`

La promoción requiere evidencia suficiente, políticas, autoridad y aprobación explícita. Una violación invalida el candidato ejecutable y permite restaurar el baseline. El historial puede conservarse como evidencia sin concederle capacidad de ejecución externa.

## 6. Identidad y colaboración

La identidad del usuario es el contexto raíz de recursos, permisos y paquetes. La colaboración concede capacidades sobre recursos concretos; no equivale a acceso global al proyecto.

## 7. LLaMA / LOGIC / TDCP

LLaMA: asesor semántico no complaciente.
LOGIC: decisión determinista sobre invariantes y reglas.
TDCP/Gatekeeper: autoridad sobre recursos y operaciones.
Action Gate: frontera efectiva para ejecución y acceso externo.

## 8. Evidencia

`No Evidence -> No Success Claim`.

Escalera conceptual:
`IMPLEMENTED -> EXECUTED -> TESTED -> VERIFIED -> VALIDATED -> PROMOTABLE -> EXTERNAL`

## 9. UX de bajo riesgo

La transparencia no debe convertirse en burocracia. El sistema debe graduar fricción por riesgo: cambios locales reversibles pueden ejecutarse directamente; operaciones multi-componente, persistentes o externas requieren más evaluación.
