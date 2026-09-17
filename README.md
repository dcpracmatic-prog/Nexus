<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c2c2b8d9-592e-4c2b-a89e-d85758d2245c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Laboratorio de Validación

La pestaña **Ajustes / Laboratorio** integra un flujo de validación orientado a usuarios técnicos y no técnicos:

- Subida de CSV, JSON, JSONL, TXT, Markdown y LOG.
- Solicitud en lenguaje natural.
- LLaMA local/gratuito como intérprete y asistente, con Ollama opcional mediante `OLLAMA_URL` y `LLAMA_MODEL`.
- Arbitraje determinista interno del runtime; la etiqueta no entra en la decisión.
- Contexto `proto + service + state` cuando está presente.
- Separación `PASS / REVIEW / REJECT / REFERENCE`.
- Métricas e invariantes visibles.
- Terminal real integrada para inspección y ejecución manual.
- Botón de parada para el runtime LLaMA/proceso activo.

### Principio

`LLaMA interpreta -> NEXUS arbitra -> terminal demuestra -> usuario inspecciona`

La IA no debe convertirse en autoridad por sí misma. Las etiquetas, cuando existen, se reservan para evaluación post-hoc. La validación debe mostrar qué se ejecutó, con qué evidencia y qué resultado produjo.

### LLaMA local

El chat puede conectarse a un servidor Ollama local. Por defecto se intenta `http://127.0.0.1:11434/api/chat` con `llama3.2:3b`; estos valores se pueden cambiar mediante variables de entorno. Si Ollama no está disponible, la aplicación mantiene un resumen local determinista y no inventa una respuesta de modelo.

### Alcance de esta versión

Esta entrega consolida la interfaz y el pipeline de prueba. No presenta las heurísticas de MORPH como prueba formal de optimalidad, ni convierte los stubs criptográficos de TDCP en seguridad de producción.

## Corte de Caja — Respaldo V1

Esta copia queda congelada como respaldo de arquitectura y código. El nuevo diseño de V1 separa explícitamente: usuario (autoridad de intención), interpretación semántica, arbitraje determinista interno, TDCP/Gatekeeper (autoridad y enforcement de recursos) y sandbox (experimentación mutable y descartable).

La documentación `BACKUP_V1.md` y `docs/ARCHITECTURE_V1.md` distingue lo que ya funciona de lo que queda definido para la siguiente implementación. En particular, el terminal y la ejecución actuales todavía no constituyen un sandbox de seguridad.


## Corte de Concepto V2

V2 convierte el laboratorio en el inicio de un Runtime Control Plane: LLaMA evalúa intención de forma técnica, ética y no complaciente; el runtime aplica arbitraje determinista; los experimentos reciben workspace/base/candidate/evidence; y la promoción queda separada de la ejecución.

La regla operativa central es: **no afirmar que todo está bien; identificar qué falta para poder afirmarlo**.

Consulta `docs/ARCHITECTURE_V2_CONCEPT.md`, `docs/V2_AUDIT.md` y `docs/CUTOVER_STATUS_V2.json`.

## Visión NEXUS

NEXUS se define como una plataforma de creación computacional gobernada —aplicación, runtime, API y SDK— que funciona como capa de creación sobre ecosistemas como GitHub, Google Workspace y AWS. El trabajo puede avanzar de forma abierta y no lineal. La **Visión final del Usuario** se declara cuando éste decide solicitar la salida de un MVP; NEXUS no modifica silenciosamente esa declaración.

La filosofía queda expresada en dos principios: **“Nada es perfecto. Avanzamos compartiendo lo bueno.”** y **“Una visión clara + interacción estratégica = creación cada vez más certera.”**. La visión completa y su contrato de evolución están en `docs/VISION_NEXUS.md`.


## Fundamental: salida gobernada
La visión final se declara al terminar la creación, no al comenzar. `Preparar salida` evalúa la declaración contra evidencia, excedentes observados y la Constitución NEXUS. Una declaración no es evidencia: `No Evidence → No Success Claim`.


## V1 Operativa

La especificación y límites de este corte están en `docs/OPERATIVE_V1.md`.
