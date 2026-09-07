# NEXUS V4 — Vision Architecture 1.0

This version is cumulative and is built directly from the consolidated `Nexus.zip` backup.

Preservation:
- V1 remains under the historical chain.
- V2 remains under the historical chain.
- The previous consolidated V3 state is preserved as `history/v3/` at the backup root.
- The active implementation remains under `nexus/` at the backup root.

Architecture update:
- `NexusVision` is now workspace context, not the final exit vision.
- `NexusExitGate` is the explicit final declaration boundary.
- `runtime/vision` evaluates exit readiness.
- `runtime/constitution` defines non-editable invariants.
- `runtime/promotion` separates validation from promotion.
- The encrypted package payload records workspace context, declared vision and exit evaluation.
- `docs/FUNDAMENTALES.md` is the canonical fundamental architecture statement.
- `docs/ACTA_CONCEPTO_NEXUS.md` records the concept act.

Important implementation limit: this update aligns the semantic and decision architecture, but it does not claim that the existing terminal, HTTP, Git or filesystem endpoints are already a real security boundary. A real isolated sandbox and a single Action Gate remain required before making that claim.
