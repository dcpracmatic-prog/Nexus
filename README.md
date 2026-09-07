# NEXUS

NEXUS es una plataforma de creación computacional gobernada: interpreta la intención del usuario, arbitra operaciones de forma determinista y mantiene separadas la experimentación, la evidencia y la promoción.

La aplicación combina:

- **Frontend React/Vite** en `src/`.
- **Servidor Express** en `server.ts`.
- **Runtime gobernado** en `runtime/`.
- **Pruebas del runtime** en `tests/`.
- **Documentación de producto y arquitectura** en `docs/`.

## Inicio rápido

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

Variables opcionales:

- `GEMINI_API_KEY`: habilita las llamadas al modelo Gemini.
- `OLLAMA_URL`: servidor Ollama para el laboratorio local.
- `LLAMA_MODEL`: modelo de Ollama; por defecto `llama3.2:3b`.
- `PORT`: puerto HTTP; por defecto `3000`.

## Comandos

```bash
npm run dev       # desarrollo con servidor Express y Vite
npm run build     # compila frontend y servidor en dist/
npm start         # ejecuta el servidor compilado
npm run lint      # comprobación de tipos
npm test          # pruebas del runtime
npm run check     # tipos + pruebas
```

## Estructura

```text
.
├── docs/                 # visión, arquitectura, operación y auditorías
├── public/               # recursos estáticos
├── runtime/              # arbitraje, capacidades, sandbox y promoción
├── scripts/              # utilidades de mantenimiento
├── src/
│   ├── components/       # interfaz React
│   ├── data/             # datos iniciales
│   └── lib/              # Firebase y motor lógico
├── tests/                # pruebas automatizadas
├── server.ts             # API y servidor de producción
├── render.yaml           # despliegue en Render
└── firestore.rules       # reglas de Firestore
```

## Principio operativo

`LLaMA interpreta → NEXUS arbitra → terminal demuestra → usuario inspecciona`

La IA interpreta intención, pero no adquiere autoridad por sí misma. Las capacidades externas requieren autorización; las operaciones pasan por el runtime; las pruebas producen evidencia; y la promoción exige una decisión explícita.

## Laboratorio de validación

La pestaña **Ajustes / Laboratorio** acepta CSV, JSON, JSONL, TXT, Markdown y LOG. El flujo separa `PASS`, `REVIEW`, `REJECT` y `REFERENCE`, muestra métricas e invariantes y permite inspeccionar la evidencia producida.

La interfaz puede usar Ollama localmente. Si no está disponible, conserva un resumen determinista y no inventa una respuesta de modelo.

## Documentación

El índice de documentación está en [`docs/README.md`](docs/README.md). Los respaldos históricos se conservan en `docs/archive/` y no se mezclan con la documentación operativa vigente.

## Alcance

Esta versión no presenta las heurísticas de MORPH como prueba formal de optimalidad ni convierte los stubs criptográficos de TDCP en seguridad de producción. El terminal y la ejecución actuales tampoco deben considerarse un sandbox de seguridad aislado.