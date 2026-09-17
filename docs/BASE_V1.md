# NEXUS BASE V1

**What this is:** the official product base for NEXUS as a **competitive market platform** of governed computational creation — not a validation lab, not an agent fleet, not a Gemini-dependent app.

**SHA:** `329b38e` (placeholder — parent fills exact freeze SHA after commit)

## In scope (this base)

- Product UI: **Crear / Analizar / Experimentar / Recursos / Management / Render**
- **Ajustes** (theme, frontier toggles, external capabilities, `.nexus.pkg` backup)
- **Exit Gate** + final vision declaration (READY / BLOCKED; constitution + evidence)
- Runtime: authority/evidence/promotion/sandbox helpers; interpreter = **LLaMA/Ollama** + deterministic local fallback
- Canonical docs only: `ACTA_CONCEPTO_NEXUS`, `FUNDAMENTALES`, `VISION_NEXUS`, `OPERATIVE_V1`, `SANDBOX_V1` (+ this page)

## Out of scope (deliberate)

- TDCP / Validation Lab UI / Gemini critical path
- Autonomous publish to GitHub, AWS, Google, etc.
- Kernel/container sandbox as a claimed security boundary (app/process barrier only)
- Agent “medallas”, AUDIT clutter, or restored deleted UI

Aligned with **FUNDAMENTALES**: Intelligence ≠ authority; No Evidence → No Success Claim; Render ≠ publish; Contención until explicit READY promotion.

## How to run

```bash
npm install
npm run dev          # local app
npm run build && npm start   # production-local
```

Optional: copy `.env.example` → `.env` for `OLLAMA_URL` / `LLAMA_MODEL`.

## How to verify

```bash
npm run lint
npm run build
npm run test:runtime
```

These are engineering checks in the repo — not a product Validation Lab.
