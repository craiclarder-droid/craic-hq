# Craic HQ 1.1.3 — Safe Delivery Delete

Data-preserving patch. The browser database key is unchanged.

Adds:
- Delete button for unused supplier lots
- Used or partly used lots are locked
- Completed production traceability prevents deletion
- Deleting an unused lot removes its matching inbound movement
- Resource stock total is recalculated automatically
- A deletion audit entry is retained

No recipes, plans, batches, orders, costs, HACCP records or traceability records are changed.

Export a backup before updating. Upload all files to the GitHub repository root and replace the existing files.
