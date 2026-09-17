# NEXUS

Plataforma de **creación computacional gobernada**. Una persona —con o sin conocimientos de programación— puede construir aplicaciones, sistemas o artefactos digitales de forma libre y no lineal, conservando el control sobre lo creado y sobre las condiciones bajo las cuales algo puede salir al exterior.

NEXUS no sustituye GitHub, Google Workspace, AWS ni otros ecosistemas: actúa como **capa de creación** sobre ellos. La IA **interpreta, informa, organiza y propone**; la **autoridad** sobre intención, alcance, conexión, transformación y salida permanece en el usuario.

> “Construye con IA sin perder el control de lo que construiste.”  
> “Nada es perfecto. Avanzamos compartiendo lo bueno.”

## Cómo ejecutar

**Requisitos:** Node.js

```bash
npm install
npm run dev
```

Opcional: producción local

```bash
npm run build
npm start
```

## Intérprete (sin Gemini)

El camino de chat / interpretación es:

1. **LLaMA vía Ollama local** (`OLLAMA_URL`, `LLAMA_MODEL`)
2. Si Ollama no está disponible → **respaldo determinista local** (no inventa evidencia de modelo)

No se requiere `GEMINI_API_KEY`. Copia `.env.example` a `.env` si quieres ajustar Ollama:

```bash
OLLAMA_URL=http://127.0.0.1:11434/api/chat
LLAMA_MODEL=llama3.2:3b
```

Principio operativo: `LLaMA interpreta → NEXUS arbitra → evidencia / terminal demuestran → el usuario decide`.

## Documentación canónica

Sólo estos cinco documentos en `docs/`:

| Documento | Contenido |
|-----------|-----------|
| [`docs/ACTA_CONCEPTO_NEXUS.md`](docs/ACTA_CONCEPTO_NEXUS.md) | Naturaleza del sistema y principio rector |
| [`docs/FUNDAMENTALES.md`](docs/FUNDAMENTALES.md) | Autoridad, evidencia, constitución, promoción |
| [`docs/VISION_NEXUS.md`](docs/VISION_NEXUS.md) | Visión de producto y capa de creación |
| [`docs/OPERATIVE_V1.md`](docs/OPERATIVE_V1.md) | Corte operativo V1 y límites deliberados |
| [`docs/SANDBOX_V1.md`](docs/SANDBOX_V1.md) | Sandbox efímero de aplicación (no kernel) |

## Límites honestos de V1 (OPERATIVE_V1)

- Análisis de artefacto **estático** / por señales; no prueba exhaustiva de comportamiento.
- Confirmación de pruebas V1 = **evidencia declarada** por el usuario; no ejecución automática completa del MVP.
- Sandbox de Render = barrera de **aplicación/proceso**, no contenedor/kernel de seguridad.
- Credenciales de terceros y secretos de producción requieren backend dedicado.
- Salida JSON = interoperabilidad V1, no empaquetador universal de ejecutables.
- `Render ≠ publish`. `Execute ≠ expose`. Sólo salida `READY` con aprobación explícita puede promoverse.
- `No Evidence → No Success Claim`.

## English (short)

NEXUS is a **governed computational creation** platform: AI interprets; the user keeps authority. Run with Node (`npm install`, `npm run dev`). Interpreter path is **local LLaMA/Ollama** with a deterministic fallback — **not Gemini**. See the five docs above for vision, fundamentals, and V1 limits (sandbox is app-level, not a kernel).

## Licencia

Ver [`LICENSE`](LICENSE).
