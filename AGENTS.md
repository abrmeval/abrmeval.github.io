# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

This is a **Docusaurus 3.9.2 static documentation site** — a personal developer reference
guide covering .NET/C#, ASP.NET Core, Azure, SQL Server, and JavaScript. It is deployed
to Vercel. All site source lives under `docusaurus-dev-guide/`.

```text
abrmeval.github.io/
├── docusaurus-dev-guide/   ← entire website (work here)
│   ├── docs/               ← markdown/MDX content
│   ├── src/                ← React components and pages
│   │   ├── pages/
│   │   └── components/
│   ├── docusaurus.config.ts
│   ├── sidebars.ts
│   ├── tsconfig.json
│   └── package.json
├── vercel.json
└── README.md
```

---

## Build / Dev Commands

All commands must be run from inside `docusaurus-dev-guide/`.

| Purpose | Command |
|---|---|
| Install dependencies | `npm install` |
| Start dev server (hot reload) | `npm run start` |
| Production build | `npm run build` |
| Serve production build locally | `npm run serve` |
| TypeScript type check | `npm run typecheck` |
| Clear Docusaurus cache | `npm run clear` |

**There is no test suite.** This is a content-only static site with no application logic
to test. Do not attempt to run `npm test` — it is not configured.

**There is no linter or formatter configured.** No ESLint, Prettier, or similar tools are
present. Maintain consistency with the surrounding code style manually.

### Vercel deployment (handled automatically)
```json
{
  "buildCommand": "cd docusaurus-dev-guide && npm run build",
  "outputDirectory": "docusaurus-dev-guide/build",
  "installCommand": "cd docusaurus-dev-guide && npm install"
}
```

---

## TypeScript Style

- **Target:** TypeScript ~5.6.2, extending `@docusaurus/tsconfig` (editor experience only;
  Docusaurus handles the actual compilation via its own Babel/SWC pipeline).
- Use `type` aliases for object shapes: `type CardItem = { title: string; ... }`.
- Use `interface` only when extension/merging is specifically needed.
- Always use `import type` for type-only imports:
  ```ts
  import type { ReactNode } from 'react';
  import type { Config } from '@docusaurus/types';
  ```
- Prefer explicit return types on exported functions and components.
- Use `satisfies` for config objects where Docusaurus types expect it:
  ```ts
  export default config satisfies Preset.ThemeConfig;
  ```

---

## React / Component Style

- **Functional components only** — no class components.
- Use destructured props with explicit type annotation:
  ```ts
  function Card({ title, description, to }: CardItem) { ... }
  ```
- **CSS Modules** for all component styles — import as `styles` and apply via
  `styles.className`. No inline styles, no global class names on components.
- Use `clsx` for conditional/combined class names:
  ```ts
  import clsx from 'clsx';
  className={clsx(styles.base, isActive && styles.active)}
  ```
- Use Docusaurus's own `Link` component (from `@docusaurus/Link`) for navigation links,
  not raw `<a>` tags.
- Use Docusaurus `Heading` component (`@theme/Heading`) for semantic headings.
- No state management (Redux, Zustand, etc.) — this site has no dynamic state.
- Avoid hooks unless genuinely needed; most components are pure render functions.

---

## Import Order & Organization

Order imports as follows (no blank lines between groups unless adding readability):

1. React core (`import React from 'react'`, `import type { ReactNode } from 'react'`)
2. Third-party packages (`@docusaurus/...`, `clsx`, `prism-react-renderer`, etc.)
3. Internal components (`../components/...`, `./SomeComponent`)
4. Styles (`import styles from './styles.module.css'`)

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| React components | PascalCase | `HomepageFeatures`, `Card` |
| Component files/folders | PascalCase | `HomepageFeatures/index.tsx` |
| Page files | lowercase | `index.tsx`, `markdown-page.md` |
| CSS Module files | camelCase suffix | `styles.module.css`, `index.module.css` |
| Docs files | `kebab-case.md` | `custom-middleware-guide.md` |
| Docs folders | `kebab-case` | `aspnet-core/`, `azure-functions/` |
| Type/interface names | PascalCase | `CardItem`, `Section`, `FeatureItem` |
| Variables & constants | camelCase | `sections`, `featureList` |
| Config exports | camelCase, default export | `export default config` |

---

## Documentation / Markdown Content Style

All docs live under `docusaurus-dev-guide/docs/` and use `.md` or `.mdx`.

### Frontmatter (required on every doc)
```yaml
---
title: "Descriptive Title Here"
sidebar_label: "Short Label"
sidebar_position: 2
tags: [tag1, tag2]
---
```

- `title`: Full descriptive title shown in the page header.
- `sidebar_label`: Short version for the sidebar nav.
- `sidebar_position`: Integer controlling order within the folder.
- `tags`: Lowercase, hyphenated if multi-word (e.g., `aspnet-core`, `azure`).

### Content Guidelines

- Use `##` for major sections, `###` for subsections. Avoid `#` (conflicts with page title).
- Always specify the language on fenced code blocks:
  ` ```csharp `, ` ```typescript `, ` ```bash `, ` ```sql `, ` ```json `, ` ```yaml `
- Add inline comments inside code blocks to explain non-obvious lines.
- Use **bold** for key terms on first use within a section.
- Use analogies and plain-language explanations — this is a learning reference, not API docs.
- Keep paragraphs short; prefer bullet lists for enumerations of 3+ items.
- `.md` files are parsed as CommonMark. `.mdx` files support JSX components.
  (`markdown.format: 'detect'` is set in `docusaurus.config.ts`.)

### Sidebar organization
Sidebars are **auto-generated** from the filesystem (`type: 'autogenerated'`). To control
order, use `sidebar_position` in frontmatter. To group pages, use subdirectories with a
`_category_.json` file:
```json
{ "label": "Deep Dives", "position": 10 }
```

---

## Docusaurus Config (`docusaurus.config.ts`)

- Blog is **disabled** (`blog: false`).
- Docs root path is `/docs` (not `/`).
- Broken links cause a **build error** (`onBrokenLinks: 'throw'`) — fix them before
  committing.
- Broken markdown links produce warnings (`onBrokenMarkdownLinks: 'warn'`).
- Search is provided by `@easyops-cn/docusaurus-search-local` (offline, no API key needed).
- Supported Prism languages: `csharp`, `powershell`, `bash`, `sql`, `json`, `yaml`,
  `typescript`. To add more, update `prism.additionalLanguages` in `docusaurus.config.ts`.
- Color mode respects `prefers-color-scheme` OS setting by default.

---

## Error Handling

This is a static content site — there is no runtime error handling to implement. However:

- **Build-time errors**: Fix all TypeScript errors (`npm run typecheck`) and broken link
  errors before pushing. `onBrokenLinks: 'throw'` will fail the Vercel deploy.
- **External links**: Use `target="_blank" rel="noopener noreferrer"` on all external `<a>`
  tags or pass `external` prop to the `Card` component.

---

## Git / Workflow Notes

- The main branch deploys automatically to Vercel on push.
- Run `npm run build` locally to catch broken-link errors before pushing.
- No CI test workflow exists — the Vercel build is the effective CI gate.
