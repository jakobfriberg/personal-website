# Repository Guidelines

## Coding Style & Naming Conventions

**Formatting**: 2-space indentation, single quotes, trailing commas, semicolons. Print width 80 characters.

**Naming**:
- Variables/functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Classes: `PascalCase`
- Component files: `PascalCase.tsx`
- Utility files: `kebab-case.ts`
- Hook files: `use-*.ts`

**Imports**: External libraries first, then internal modules (`@/...`), then relative imports.

**Comments**: Explain WHY, not WHAT. Avoid obvious comments.

See `.docs/code-style.mdc` and `.docs/typescript-guidelines.mdc` for comprehensive guidelines.

## Commit & Pull Request Guidelines

Use short imperative subjects (72 chars max). Describe what the change does, reserve body for rationale. PRs should link to the relevant ticket, summarize user impact, outline QA steps, and include screenshots for visual changes. Keep PRs scoped narrowly.

## Data Extraction Principles

**No silent fallbacks.** When extracting data:
- Use explicit, single sources per data type
- If data is missing, show "missing" state - don't silently fall back to alternatives
- Fallback chains mask bugs and make debugging harder
