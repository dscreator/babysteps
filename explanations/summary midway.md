**Project Snapshot**
- Full-stack ISEE prep tutor with React/Tailwind front end and Express/Supabase back end; key routes wired in  and .
- Core flows cover auth, practice sessions, analytics dashboards, and AI interaction logging, all funneled through shared Supabase data models in .
- Development mode runs entirely on mocked data/services, so UX can be exercised before real Supabase keys or OpenAI endpoints are live (, ).
- Docs, seeds, and shared types keep the project aligned:  for setup,  for sample content,  for cross-layer contracts.

**Frontend**
- React 18 + Vite app wrapped in an auth provider that toggles between Supabase and local mock sessions ().
- React Router routes gate practice/progress views behind , while toast notifications standardize feedback ().
- React Query caches Supabase-backed APIs; dashboard hooks merge profile + progress (, ).
- Practice suites are modular: configurable math sessions with timers, hints, and feedback (), rich reading/vocabulary flow (), and essay scaffolds.
- Dashboard + Progress pages visualize streaks, goals, achievements, and per-topic performance (, ).

**Backend**
- Express server layers security middleware (Helmet, CORS, rate limits) before routing to auth, practice, progress, and AI endpoints (, ).
- Auth service wraps Supabase Admin API for registration/login/profile management and token verification ().
- Practice service centralizes session lifecycle, answer evaluation, hint tracking, and AI interaction logging, with math-specific grading logic and English analytics ().
- Content service exposes math problems, passages, vocabulary, and essay prompts with filtering and randomization ().
- Progress service synthesizes session stats into streaks, topic scores, milestones, and snapshots for dashboards (); tutor routes remain placeholders for future AI work ().

**Data Layer**
- Supabase schema models users, progress, sessions, content, AI interactions, and achievements with RLS policies to enforce per-user access ().
- Seed scripts hydrate math/reading/vocab/essay tables and can be run via .
- Shared TypeScript typings keep API payloads consistent across layers (, ).

**Notable Gaps**
- AI tutor endpoints are stubbed; they currently return placeholder responses.
- Frontend still leans on mock services when , so production toggles and end-to-end auth/content testing need validation.
- Error handling/logging is basic; observability, rate-limit feedback, and retry strategies could evolve when real services are connected.
