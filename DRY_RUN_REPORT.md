# DRY-RUN: Replace double-underscores ("__") with directory separators ("/")

This branch (rename/underscore-structure) contains a dry-run script and a report that list the planned changes to convert filenames and import strings that use double underscores ("__") as separators into proper directory structures.

What I added in this branch (dry-run only)

- scripts/replace_double_underscore.js
  - A Node.js script that scans the repository for filenames containing "__" and prints planned moves, and also scans text files for string literals containing "__" and prints planned edits.
  - By default the script runs in dry-run mode (no filesystem changes). Run with `--apply` to perform moves and edits.

- DRY_RUN_REPORT.md (this file)
  - Lists the planned file moves and the approach used to update imports.

Planned file moves (origin -> destination)

- docs__ARCHITECTURE_V1.md -> docs/ARCHITECTURE_V1.md
- docs__ARCHITECTURE_V2_CONCEPT.md -> docs/ARCHITECTURE_V2_CONCEPT.md
- docs__ARCHITECTURE_V3.md -> docs/ARCHITECTURE_V3.md
- docs__CONSOLIDATION_MANIFEST.json -> docs/CONSOLIDATION_MANIFEST.json
- docs__CUTOVER_STATUS_V1.json -> docs/CUTOVER_STATUS_V1.json
- docs__CUTOVER_STATUS_V2.json -> docs/CUTOVER_STATUS_V2.json
- docs__CUTOVER_STATUS_V3.json -> docs/CUTOVER_STATUS_V3.json
- docs__FUNDAMENTALES.md -> docs/FUNDAMENTALES.md
- docs__OPERATIVE_V1.md -> docs/OPERATIVE_V1.md
- docs__SANDBOX_V1.md -> docs/SANDBOX_V1.md
- docs__SHA256SUMS_V1.txt -> docs/SHA256SUMS_V1.txt
- docs__SHA256SUMS_V3.json -> docs/SHA256SUMS_V3.json
- docs__V1_COMPLETION_AUDIT.md -> docs/V1_COMPLETION_AUDIT.md
- docs__V1_COMPLETION_CHECKLIST.md -> docs/V1_COMPLETION_CHECKLIST.md
- docs__V1_DEPLOY_AUDIT.md -> docs/V1_DEPLOY_AUDIT.md
- docs__V1_MANIFEST.json -> docs/V1_MANIFEST.json
- docs__V2_AUDIT.md -> docs/V2_AUDIT.md
- docs__V3_AUDIT.md -> docs/V3_AUDIT.md
- docs__VERSION_CHAIN.md -> docs/VERSION_CHAIN.md
- docs__VISION_NEXUS.md -> docs/VISION_NEXUS.md

- public__assets__aistudio__.gitignore -> public/assets/aistudio/.gitignore

- runtime__actionGate__index.ts -> runtime/actionGate/index.ts
- runtime__audit__trace.ts -> runtime/audit/trace.ts
- runtime__authorization__resourceAuthority.ts -> runtime/authorization/resourceAuthority.ts
- runtime__capabilities__index.ts -> runtime/capabilities/index.ts
- runtime__constitution__embeddedCodeAnalysis.ts -> runtime/constitution/embeddedCodeAnalysis.ts
- runtime__constitution__index.ts -> runtime/constitution/index.ts
- runtime__experiments__experiment.ts -> runtime/experiments/experiment.ts
- runtime__index.ts -> runtime/index.ts
- runtime__intent__assessor.ts -> runtime/intent/assessor.ts
- runtime__isolation__index.ts -> runtime/isolation/index.ts
- runtime__logic__index.ts -> runtime/logic/index.ts
- runtime__package__artifactExporter.ts -> runtime/package/artifactExporter.ts
- runtime__package__index.ts -> runtime/package/index.ts
- runtime__package__nexusPackage.ts -> runtime/package/nexusPackage.ts
- runtime__policy__commandGate.ts -> runtime/policy/commandGate.ts
- runtime__promotion__index.ts -> runtime/promotion/index.ts
- runtime__promotion__releaseGate.ts -> runtime/promotion/releaseGate.ts
- runtime__release__analyzer.ts -> runtime/release/analyzer.ts
- runtime__release__index.ts -> runtime/release/index.ts
- runtime__sandbox__index.ts -> runtime/sandbox/index.ts
- runtime__secrets__index.ts -> runtime/secrets/index.ts
- runtime__types.ts -> runtime/types.ts
- runtime__vision__exitEvaluator.ts -> runtime/vision/exitEvaluator.ts
- runtime__vision__index.ts -> runtime/vision/index.ts

- src__App.tsx -> src/App.tsx
- src__components__AgentFleetManager.tsx -> src/components/AgentFleetManager.tsx
- src__components__FailoverBanner.tsx -> src/components/FailoverBanner.tsx
- src__components__Header.tsx -> src/components/Header.tsx
- src__components__JobDelegationPanel.tsx -> src/components/JobDelegationPanel.tsx
- src__components__LogicEngineConfigBox.tsx -> src/components/LogicEngineConfigBox.tsx
- src__components__MarkdownRenderer.tsx -> src/components/MarkdownRenderer.tsx
- src__components__NexusExitGate.tsx -> src/components/NexusExitGate.tsx
- src__components__NexusModules.tsx -> src/components/NexusModules.tsx
- src__components__NexusSettings.tsx -> src/components/NexusSettings.tsx
- src__components__NexusVision.tsx -> src/components/NexusVision.tsx
- src__components__ProjectManager.tsx -> src/components/ProjectManager.tsx
- src__components__RealTerminal.tsx -> src/components/RealTerminal.tsx
- src__components__RuntimeControlPlane.tsx -> src/components/RuntimeControlPlane.tsx
- src__components__SolidaritiesList.tsx -> src/components/SolidaritiesList.tsx
- src__components__ValidationLab.tsx -> src/components/ValidationLab.tsx
- src__components__VectorDatabasePanel.tsx -> src/components/VectorDatabasePanel.tsx
- src__components__VoiceAssistantModal.tsx -> src/components/VoiceAssistantModal.tsx
- src__components__WorkflowBuilder.tsx -> src/components/WorkflowBuilder.tsx

- src__data__initialData.ts -> src/data/initialData.ts
- src__index.css -> src/index.css
- src__lib__firebase.ts -> src/lib/firebase.ts
- src__lib__logicEngine.ts -> src/lib/logicEngine.ts
- src__main.tsx -> src/main.tsx
- src__types.ts -> src/types.ts

- tests__releaseGate.test.ts -> tests/releaseGate.test.ts

Planned edits in code (imports/config strings)

- The script will scan files with extensions: .ts, .tsx, .js, .jsx, .mjs, .cjs, .json, .html, .md, .css, .scss, .less
- It replaces `"__"` inside quoted strings with `/`. Example:
  - import X from '../src__components__Header' -> import X from '../src/components/Header'

Conflict handling (dry-run behavior)

- The script will print [SKIP] for targets that already exist and will not overwrite them.
- In apply mode, existing targets are skipped; review them manually.

How to review this dry-run branch

1. Checkout the branch locally:
   git fetch origin
   git checkout rename/underscore-structure

2. Run the dry-run locally:
   node scripts/replace_double_underscore.js

3. Review the printed list of moves and edits. If you want to apply changes, run:
   node scripts/replace_double_underscore.js --apply

Next steps I can take for you

- Apply the changes and open a PR (you already asked for dry-run only). If you confirm, I will run apply and commit.
- Add a GitHub Action to run this script automatically (manual dispatch) — useful if you want CI-driven application.

If you want further exclusions, tell me which files to exclude from the conversion.
