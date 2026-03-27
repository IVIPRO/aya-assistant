# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run build` — esbuild bundle to `dist/index.cjs` (required after source changes)
- Dev runtime: the **`api-server-live`** workflow runs `node dist/index.cjs` directly (compiled bundle). After any source code change, rebuild with the build command above, then restart the `api-server-live` workflow.
- Note: the artifact-managed workflow (`artifacts/api-server: API Server`) has a persistent Replit port-detection bug and always shows "failed" — ignore it. Use `api-server-live` instead.
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### Junior Chat Handler (`src/lib/juniorChatHandler.ts`)

Key system for the Junior module. Intent-based routing:
- **Quick action buttons** (BG: "Помогни ми с математика", "Да четем заедно", "Задай ми логически въпрос", "Упражнявай с мен английски") → `isQuickActionButton()` returns "math" | "reading" | "logic" | "english"
- **Math**: `new_math_task` intent → `generateMathTask()`, persists via `active_question` memory
- **Reading**: `new_reading_task` → `storeBulgarianLesson(reading_comprehension_basic/extended)` → reuses full BG evaluator pipeline
- **Logic / English**: `new_logic_task` / `new_english_task` → OpenAI generates task via `generateSubjectQuestion()`, stores in `open_subject_session` memory so next message is evaluated via `evaluateSubjectAnswer()` (not free-chat)
- **Context persistence**: `memoriesTable` types used: `active_question`, `post_success_followup`, `bulgarian_lesson_active`, `open_subject_session`
- **New helper functions**: `getAIResponseWithSystemPrompt()` (in aiResponses.ts), `getCharacterName()`, `generateSubjectQuestion()`, `evaluateSubjectAnswer()`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

## AYA Teaching Engine (api-server/src/lib)

Key teaching files for the Junior (grades 1–7) learning module:

| File | Purpose |
|---|---|
| `bgCurriculum.ts` | Bulgarian MoE curriculum data: topics, skills per grade/subject |
| `bgCurriculumTeaching.ts` | **Teaching engine**: grade-aware math explanations, Bulgarian language explanations (nouns/verbs/adjectives/spelling/reading), curriculum context builder, BG task detector |
| `freeConversationHandler.ts` | Free chat AI handler: injects curriculum context into system prompt, detects BG language tasks (local shortcut, no AI cost), grade-aware prompts |
| `aiResponses.ts` | `getMathFeedback()` + `getStepByStepExplanation()` — grade-aware via `bgCurriculumTeaching.ts` |
| `juniorChatHandler.ts` | Intent router for math tasks, BG lessons, homework |
| `weaknessDetection.ts` | **Authoritative weak-topic detector**: computes weak/strong topics from `childTopicProgressTable` |
| `smartTaskSequencing.ts` | Reorders daily plan tasks to prioritize weak topics |
| `studentAdaptiveProfile.ts` | Per-child 5-level difficulty + streak tracking (JSON in `memoriesTable`) — chat-only |
| `topicProgression.ts` | Auto-advance/retreat topic difficulty (>70% → next, <30% → weak) — chat-only |

## Adaptive Learning Brain

The adaptive learning system has two layers:

### Layer 1: Persistent Progress (authoritative)
- **Storage**: `childTopicProgressTable` (PostgreSQL) — `attempts`, `correctAnswers`, `wrongAnswers`, `retryCount`, `lastActivityAt`, `quizPassed`
- **Weak topics**: `detectWeakTopics()` in `weaknessDetection.ts` — `successRate < 0.7 && attempts >= 3`
- **Strong topics**: `successRate >= 0.8 && attempts >= 5` (computed in adaptive-profile endpoint)
- **Used by**: daily plan generator, `/learning/weaknesses` API, `/learning/adaptive-profile` API, lesson engine

### Layer 2: Chat-session Difficulty (chat-only)
- **Storage**: `memoriesTable` (JSON blob) — 5-level difficulty, streaks per subject
- **Used by**: `juniorChatHandler.ts` for AI prompt adaptation only

### Adaptive Lesson Engine (lesson-viewer.tsx)
The interactive lesson engine fetches `/api/learning/adaptive-profile?childId=&subjectId=&topicId=` at load time and adapts:
- **Weak topics**: context-specific greeting ("Вече работихме по тази тема..."), supportive hint message after 1st wrong (not 2nd), correct answer revealed after 1st wrong (not 2nd), retry button styled as ghost
- **Strong topics**: confidence greeting ("Справяш се отлично..."), "Skip explanation" secondary button
- **Normal topics**: standard behavior

### `GET /api/learning/adaptive-profile`
```
Query: ?childId=N&subjectId=S&topicId=T
Returns: { weakTopics[], strongTopics[], currentTopicStats: { context: "weak"|"strong"|"normal", ... }, overallAccuracy, recommendedMode }
```
No new DB tables — pure computation from `childTopicProgressTable` via `detectWeakTopics()`.

### totalCount fix
`POST /api/learning/complete` receives `totalCount` from the lesson engine (practice = `problems.length`, quiz = `questions.length`) to accurately track `wrongAnswers` in the DB. Previously defaulted to `correctCount + 1`, overcounting wrongs.

**Teaching flow for Bulgarian grade N child:**
1. Free chat → `freeConversationHandler` detects BG grammar task → returns `getBgLanguageExplanation()` (no API call)
2. Math answer → `getMathFeedback()` → `getStepByStepExplanation(grade)` → `getGradeAwareMathExplanation()` (grade-appropriate strategy)
3. General conversation → OpenAI with system prompt enriched by `buildCurriculumContext(grade, "bg")`
