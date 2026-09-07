# NexusAgent Studio — Corte Concepto V2

Fecha: 2026-09-06
Base: Respaldo V1

## 1. Definición

NexusAgent Studio V2 no se define como un generador de aplicaciones por prompt. Se define como un **runtime experimental de creación computacional asistida**, basado en primitivas y componentes, donde la intención del usuario, la evidencia, la autoridad, la decisión y la ejecución están separadas.

## 2. Contrato de LLaMA

LLaMA es el asistente semántico profesional no complaciente.

Debe:
- interpretar intención;
- detectar ambigüedad y supuestos;
- resaltar faltantes antes que “validar” la idea;
- distinguir hecho, inferencia y posibilidad;
- pedir hasta cinco preguntas dirigidas cuando sea necesario;
- preservar el objetivo legítimo mediante redirección segura;
- proponer la construcción mínima suficiente;
- señalar cuándo una modificación puede afectar componentes dependientes;
- nunca declarar funcionamiento sin evidencia.

No debe:
- inventar métricas;
- convertir hipótesis en hechos;
- aprobar por complacencia;
- modificar silenciosamente el alcance;
- decidir autoridad sobre recursos;
- sustituir LOGIC.

## 3. Control Plane

`USER INTENT -> LLaMA ASSESSMENT -> INTENT OBJECT -> LOGIC GATE -> AUTHORIZATION -> SANDBOX -> EXECUTION -> OBSERVATION -> VERIFICATION -> CANDIDATE -> USER PROMOTION`

## 4. Minimum Sufficient Construction

La IA debe implementar el mínimo sistema completo necesario para satisfacer la intención. No debe introducir capas, agentes, servicios o abstracciones no justificadas; tampoco puede omitir dependencias necesarias.

## 5. Locality of Change

Una modificación sólo autoriza el conjunto causal de componentes necesario para esa modificación. Los componentes no relacionados permanecen intactos. Si un contrato/dependencia debe cambiar, debe aparecer en el plan y en el diff.

## 6. No Silent Mutation

Cada operación relevante debe poder reconstruirse como:

`INTENT -> SCOPE -> DEPENDENCIES -> PLAN -> AUTHORITY -> LOGIC -> EXECUTION -> DIFF -> EVIDENCE -> DECISION`

## 7. Experimentos

Cada experimento obtiene un workspace descartable con:

`workspace / baseline / candidate / datasets / tests / artifacts / metrics / patches / logs`

El baseline queda fuera del área mutable. El workspace actual de V2 es una estructura experimental; **todavía no es una frontera de seguridad de producción**.

## 8. Autoridad de recursos

TDCP/Gatekeeper se modelan como una capa independiente de autorización. La autorización debe expresar sujeto, recurso, operaciones permitidas, expiración y restricciones de persistencia/exportación/entrenamiento.

La integración TDCP real no forma parte de este corte: V2 sólo incorpora la interfaz conceptual y el gate de arquitectura.

## 9. Evidencia y promoción

`PASS` significa que una prueba concreta satisfizo sus invariantes. No significa que el sistema sea universalmente correcto, seguro o listo para producción. La promoción siempre es una decisión posterior y explícita del usuario.

## 10. Principio de viabilidad

El producto no debe demostrar que “todo está bien”. Debe demostrar que sabe identificar con precisión **qué falta para poder afirmar que está bien**.
